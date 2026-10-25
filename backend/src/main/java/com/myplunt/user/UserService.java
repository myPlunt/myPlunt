package com.myplunt.user;

import com.myplunt.common.exception.NotFoundException;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.storage.StorageService;
import com.myplunt.storage.dto.PhotoCategory;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.CompleteOnboardingRequest;
import com.myplunt.user.dto.NotificationSettings;
import com.myplunt.user.dto.UpdateAvatarRequest;
import com.myplunt.user.dto.UpdateLocationRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import com.myplunt.user.dto.UserSummaryResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private static final int SEARCH_LIMIT = 20;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StorageService storageService;
    private final UserSettingsRepository userSettingsRepository;
    private final AuditLog auditLog;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            StorageService storageService,
            UserSettingsRepository userSettingsRepository,
            AuditLog auditLog) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.storageService = storageService;
        this.userSettingsRepository = userSettingsRepository;
        this.auditLog = auditLog;
    }

    // Maps the already-loaded principal; endpoints that change the user load it fresh instead.
    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getEmail(), user.getBio(), avatarUrl(user),
                user.getOnboardingCompletedAt() != null);
    }

    // Usernames are at most 30 characters, so a longer query can't match anyone.
    @Transactional(readOnly = true)
    public List<User> searchUsers(UUID searcherId, String query) {
        String q = query.strip();
        if (q.isEmpty() || q.length() > 30) {
            return List.of();
        }
        // Escaped so "j_d" matches the literal underscore instead of any character.
        String pattern = q.toLowerCase(Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return userRepository.search(pattern, searcherId, Limit.of(SEARCH_LIMIT));
    }

    public UserSummaryResponse toSummary(User user, String friendship) {
        return new UserSummaryResponse(user.getId(), user.getUsername(), user.getBio(), avatarUrl(user), friendship);
    }

    public String avatarUrl(User user) {
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

        // The bio is free text, so only whether it changed is logged.
        List<String> changedFields = new ArrayList<>();
        Map<String, Object> details = new LinkedHashMap<>();
        if (!oldUsername.equals(saved.getUsername())) {
            changedFields.add("username");
            details.put("old_username", oldUsername);
            details.put("new_username", saved.getUsername());
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
                    Map.of("new_email", request.email()));
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        String oldEmail = user.getEmail();
        user.setEmail(request.email());
        User saved = userRepository.save(user);
        auditLog.recorded(AuditEvent.EMAIL_CHANGED, userId, userId, Map.of(
                "old_email", oldEmail,
                "new_email", saved.getEmail()));
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateAvatar(UUID userId, UpdateAvatarRequest request) {
        User user = loadUser(userId);
        if (!storageService.isCategory(request.key(), PhotoCategory.AVATAR)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "That photo can't be used as a profile picture.");
        }
        storageService.confirmUpload(userId, request.key());

        String oldKey = user.getAvatarKey();
        user.setAvatarKey(request.key());
        User saved = userRepository.save(user);
        auditLog.recorded(AuditEvent.AVATAR_UPDATED, userId, userId, Map.of("photo_key", request.key()));
        if (oldKey != null && !oldKey.equals(request.key())) {
            deleteAvatarFile(userId, oldKey);
        }
        return toResponse(saved);
    }

    // Where the user is is personal data, so the audit line says only that it changed.
    @Transactional
    public void updateLocation(UUID userId, UpdateLocationRequest request) {
        User user = loadUser(userId);
        user.setLatitude(request.latitude());
        user.setLongitude(request.longitude());
        user.setCity(request.city() == null || request.city().isBlank() ? null : request.city().strip());
        userRepository.save(user);
        auditLog.recorded(AuditEvent.LOCATION_UPDATED, userId, userId, Map.of());
    }

    // Retaking the tour from Settings ends here again; only the first time is saved and logged.
    @Transactional
    public void completeOnboarding(UUID userId, CompleteOnboardingRequest request) {
        User user = loadUser(userId);
        if (user.getOnboardingCompletedAt() != null) {
            return;
        }
        user.setOnboardingCompletedAt(Instant.now());
        userRepository.save(user);
        auditLog.recorded(AuditEvent.ONBOARDING_COMPLETED, userId, userId, Map.of("skipped", request.skipped()));
    }

    @Transactional(readOnly = true)
    public NotificationSettings notificationSettings(UUID userId) {
        return toNotificationSettings(loadSettings(userId));
    }

    @Transactional
    public NotificationSettings updateNotificationSettings(UUID userId, NotificationSettings request) {
        UserSettings settings = loadSettings(userId);
        settings.setWateringReminders(request.waterReminders());
        settings.setWeatherAlerts(request.weatherAlerts());
        settings.setFriendPostNotifications(request.friendActivity());
        settings.setFriendNudges(request.friendNudges());
        settings.setPostInteractions(request.postInteractions());
        settings.setDelegationRequests(request.plantSitting());
        NotificationSettings saved = toNotificationSettings(userSettingsRepository.save(settings));
        auditLog.recorded(AuditEvent.NOTIFICATION_SETTINGS_UPDATED, userId, userId, Map.of(
                "water_reminders", saved.waterReminders(),
                "weather_alerts", saved.weatherAlerts(),
                "friend_activity", saved.friendActivity(),
                "friend_nudges", saved.friendNudges(),
                "post_interactions", saved.postInteractions(),
                "plant_sitting", saved.plantSitting()));
        return saved;
    }

    private UserSettings loadSettings(UUID userId) {
        return userSettingsRepository.findById(userId).orElseGet(() -> new UserSettings(userId));
    }

    private static NotificationSettings toNotificationSettings(UserSettings settings) {
        return new NotificationSettings(settings.isWateringReminders(), settings.isWeatherAlerts(),
                settings.isFriendPostNotifications(), settings.isFriendNudges(), settings.isPostInteractions(),
                settings.isDelegationRequests());
    }

    // Removing a picture the user doesn't have is a no-op, so a retried request still succeeds.
    @Transactional
    public void removeAvatar(UUID userId) {
        User user = loadUser(userId);
        String oldKey = user.getAvatarKey();
        if (oldKey == null) {
            return;
        }
        user.setAvatarKey(null);
        userRepository.save(user);
        auditLog.recorded(AuditEvent.AVATAR_REMOVED, userId, userId, Map.of("photo_key", oldKey));
        deleteAvatarFile(userId, oldKey);
    }

    // Flushed so the user no longer points at the file before it's gone.
    private void deleteAvatarFile(UUID userId, String key) {
        userRepository.flush();
        // A leftover file only costs storage.
        try {
            storageService.deleteObject(key);
        } catch (RuntimeException e) {
            StructuredLog.warning(log, LogEvent.PHOTO_CLEANUP_FAILED, Map.of(
                    "user_id", userId, "photo_key", key, "reason", e.getClass().getSimpleName()));
        }
    }

    public User loadUser(UUID userId) {
        return findUser(userId).orElseThrow(() -> new NotFoundException("User not found"));
    }

    public Optional<User> findUser(UUID userId) {
        return userRepository.findById(userId);
    }

    public List<User> loadUsers(List<UUID> userIds) {
        return userRepository.findAllById(userIds);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User create(String username, String email, String passwordHash) {
        return userRepository.save(new User(username, email, passwordHash));
    }
}
