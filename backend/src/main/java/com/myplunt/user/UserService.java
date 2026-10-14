package com.myplunt.user;

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

import java.util.List;
import java.util.Locale;
import java.util.Map;
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

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            StorageService storageService,
            FriendshipRepository friendshipRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.storageService = storageService;
        this.friendshipRepository = friendshipRepository;
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
        return toSummary(user, friendship(friendship, viewerId));
    }

    // friendship is one of UserSummaryResponse's values, already worked out by the caller.
    public UserSummaryResponse toSummary(User user, String friendship) {
        return new UserSummaryResponse(user.getId(), user.getUsername(), user.getBio(), avatarUrl(user), friendship);
    }

    // Declining deletes the row, so only "blocked" (not used yet) would read as a pending request here.
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

        user.setUsername(request.username());
        user.setBio(request.bio() == null || request.bio().isBlank() ? null : request.bio().strip());

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse changeEmail(UUID userId, ChangeEmailRequest request) {
        User user = loadUser(userId);

        // 403, not 401: the frontend treats 401 as an expired session.
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Current password is incorrect");
        }
        // email is citext too: the user's own address in different case isn't taken.
        if (!user.getEmail().equalsIgnoreCase(request.email())
                && userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        user.setEmail(request.email());

        return toResponse(userRepository.save(user));
    }

    private User loadUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
    }
}
