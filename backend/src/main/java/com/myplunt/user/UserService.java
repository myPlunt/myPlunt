package com.myplunt.user;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.common.logging.LogMasking;
import com.myplunt.friend.Friendship;
import com.myplunt.friend.FriendshipRepository;
import com.myplunt.storage.StorageService;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import com.myplunt.user.dto.UserSummaryResponse;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class UserService {

    private static final int SEARCH_LIMIT = 20;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;
    private final FriendshipRepository friendshipRepository;
    private final AuditLog auditLog;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            StorageService storageService,
            FriendshipRepository friendshipRepository,
            AuditLog auditLog) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.storageService = storageService;
        this.friendshipRepository = friendshipRepository;
        this.auditLog = auditLog;
    }

    // Maps the principal JwtAuthFilter already loaded, so read-only endpoints like
    // /me don't query the same row twice. Endpoints that modify the user load it
    // fresh instead of reusing the principal (see updateProfile, changeEmail).
    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getBio());
    }

    // Other users whose username contains the query, best matches first (see UserRepository.search),
    // never the searcher themselves. Usernames are at most 30 characters, so a longer query can't match anyone.
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> search(UUID searcherId, String query) {
        String q = query.strip();
        if (q.isEmpty() || q.length() > 30) {
            return List.of();
        }
        // Escaped so "j_d" matches the literal underscore instead of any character.
        String pattern = q.toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        List<User> users = userRepository.search(pattern, searcherId, Limit.of(SEARCH_LIMIT));
        if (users.isEmpty()) {
            return List.of();
        }
        // Keyed by the other user; the pair index allows at most one row per pair.
        Map<UUID, Friendship> friendships = friendshipRepository
                .findBetween(searcherId, users.stream().map(User::getId).toList())
                .stream()
                .collect(Collectors.toMap(
                        f -> f.getRequesterId().equals(searcherId) ? f.getReceiverId() : f.getRequesterId(),
                        Function.identity()));
        return users.stream()
                .map(user -> toSummary(user, friendships.get(user.getId()), searcherId))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getSummary(UUID viewerId, UUID userId) {
        User user = loadUser(userId);
        List<Friendship> friendship = friendshipRepository.findBetween(viewerId, List.of(userId));
        return toSummary(user, friendship.isEmpty() ? null : friendship.getFirst(), viewerId);
    }

    private UserSummaryResponse toSummary(User user, Friendship friendship, UUID viewerId) {
        return new UserSummaryResponse(
                user.getId(), user.getUsername(), user.getBio(), avatarUrl(user), friendship(friendship, viewerId));
    }

    // ponytail: declined and blocked rows still read as a pending request; the decline PBI should
    // delete the row instead, or the pair index blocks asking again forever.
    private static String friendship(Friendship friendship, UUID viewerId) {
        if (friendship == null) {
            return null;
        }
        if (Friendship.ACCEPTED.equals(friendship.getStatus())) {
            return "friends";
        }
        return friendship.getRequesterId().equals(viewerId) ? "request_sent" : "request_received";
    }

    private String avatarUrl(User user) {
        return user.getAvatarKey() == null ? null : storageService.createReadUrl(user.getAvatarKey());
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = loadUser(userId);

        // username is citext, so a change in letter case alone can't clash with another account.
        if (!user.getUsername().equalsIgnoreCase(request.username())
                && userRepository.findByUsername(request.username()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        String oldUsername = user.getUsername();
        String oldBio = user.getBio();
        user.setUsername(request.username());
        user.setBio(request.bio() == null || request.bio().isBlank() ? null : request.bio().strip());
        User saved = userRepository.save(user);

        // The bio is free text, so only whether it changed is logged; usernames go in masked.
        List<String> changedFields = new ArrayList<>();
        Map<String, Object> details = new LinkedHashMap<>();
        if (!oldUsername.equals(saved.getUsername())) {
            changedFields.add("username");
            details.put("old_username", LogMasking.username(oldUsername));
            details.put("new_username", LogMasking.username(saved.getUsername()));
        }
        if (!Objects.equals(oldBio, saved.getBio())) {
            changedFields.add("bio");
        }
        details.put("changed_fields", changedFields);
        auditLog.recorded(AuditEvent.PROFILE_UPDATED, userId, userId, details);
        return toResponse(saved);
    }

    @Transactional
    public UserResponse changeEmail(UUID userId, ChangeEmailRequest request) {
        User user = loadUser(userId);

        // 403, not 401: the frontend treats 401 as an expired session.
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            auditLog.rejected(AuditEvent.EMAIL_CHANGE_REJECTED, userId, "wrong_password", Map.of());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Current password is incorrect");
        }
        // email is citext too: the user's own address in different case isn't taken.
        if (!user.getEmail().equalsIgnoreCase(request.email())
                && userRepository.findByEmail(request.email()).isPresent()) {
            auditLog.rejected(AuditEvent.EMAIL_CHANGE_REJECTED, userId, "email_in_use",
                    Map.of("new_email", LogMasking.email(request.email())));
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String oldEmail = user.getEmail();
        user.setEmail(request.email());
        User saved = userRepository.save(user);
        auditLog.recorded(AuditEvent.EMAIL_CHANGED, userId, userId, Map.of(
                "old_email", LogMasking.email(oldEmail),
                "new_email", LogMasking.email(saved.getEmail())));
        return toResponse(saved);
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
