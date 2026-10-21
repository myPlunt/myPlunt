package com.myplunt.user;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.friend.Friendship;
import com.myplunt.friend.FriendshipRepository;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private AuditLog auditLog;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private StorageService storageService;

    @Mock
    private FriendshipRepository friendshipRepository;

    private final UUID id = UUID.randomUUID();
    private User jane;

    @BeforeEach
    void setUp() {
        jane = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(jane, "id", id);
    }

    private UserService userService() {
        return new UserService(userRepository, passwordEncoder, storageService, friendshipRepository, auditLog);
    }

    @Test
    void updateProfile_updatesUsernameAndTrimmedBio() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(userRepository.findByUsername("janey")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService().updateProfile(id, new UpdateProfileRequest("janey", "  Fern collector  "));

        assertThat(response).isEqualTo(new UserResponse(id, "janey", "jane@example.com", "Fern collector", null, false));
    }

    @Test
    void updateProfile_rejectsUsernameTakenByAnotherUser() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(userRepository.findByUsername("taken"))
                .thenReturn(Optional.of(new User("taken", "other@example.com", "x")));

        assertThatThrownBy(() -> userService().updateProfile(id, new UpdateProfileRequest("taken", null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Username already taken");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changeEmail_changesEmailWhenCurrentPasswordMatches() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService().changeEmail(id, new ChangeEmailRequest("new@example.com", "password123"));

        assertThat(response.email()).isEqualTo("new@example.com");
    }

    @Test
    void changeEmail_rejectsWrongPassword() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> userService().changeEmail(id, new ChangeEmailRequest("new@example.com", "wrong")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN))
                .hasMessageContaining("Current password is incorrect");
        verify(userRepository, never()).save(any());
    }

    @Test
    void changeEmail_rejectsEmailTakenByAnotherUser() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(userRepository.findByEmail("taken@example.com"))
                .thenReturn(Optional.of(new User("other", "taken@example.com", "x")));

        assertThatThrownBy(() -> userService().changeEmail(id, new ChangeEmailRequest("taken@example.com", "password123")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email already registered");
        verify(userRepository, never()).save(any());
    }

    @Test
    void updateAvatar_confirmsTheUploadAndDeletesThePreviousPicture() {
        String newKey = "avatars/" + id + "/new.jpg";
        jane.setAvatarKey("avatars/" + id + "/old.jpg");
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(storageService.isCategory(newKey, PhotoCategory.AVATAR)).thenReturn(true);
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(storageService.createReadUrl(newKey)).thenReturn("https://storage/new.jpg");

        UserResponse response = userService().updateAvatar(id, new UpdateAvatarRequest(newKey));

        verify(storageService).confirmUpload(id, newKey);
        verify(storageService).deleteObject("avatars/" + id + "/old.jpg");
        assertThat(jane.getAvatarKey()).isEqualTo(newKey);
        assertThat(response.avatarUrl()).isEqualTo("https://storage/new.jpg");
    }

    @Test
    void updateAvatar_rejectsAKeyThatIsNotAProfilePicture() {
        String plantKey = "plants/" + id + "/photo.jpg";
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(storageService.isCategory(plantKey, PhotoCategory.AVATAR)).thenReturn(false);

        assertThatThrownBy(() -> userService().updateAvatar(id, new UpdateAvatarRequest(plantKey)))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(storageService, never()).confirmUpload(any(), any());
        verify(userRepository, never()).save(any());
    }

    @Test
    void removeAvatar_clearsThePictureAndDeletesItsFile() {
        jane.setAvatarKey("avatars/" + id + "/old.jpg");
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));

        userService().removeAvatar(id);

        assertThat(jane.getAvatarKey()).isNull();
        verify(userRepository).save(jane);
        verify(storageService).deleteObject("avatars/" + id + "/old.jpg");
    }

    @Test
    void updateLocation_savesTheCoordinatesAndTrimmedCity() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));

        userService().updateLocation(id, new UpdateLocationRequest(52.22, 6.89, "  Enschede "));

        assertThat(jane.getLatitude()).isEqualTo(52.22);
        assertThat(jane.getLongitude()).isEqualTo(6.89);
        assertThat(jane.getCity()).isEqualTo("Enschede");
        verify(userRepository).save(jane);
    }

    @Test
    void completeOnboarding_savesAndLogsTheFirstTimeOnly() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));

        userService().completeOnboarding(id, new CompleteOnboardingRequest(true));
        Instant completedAt = jane.getOnboardingCompletedAt();
        // Retaking the tour from Settings finishes it again.
        userService().completeOnboarding(id, new CompleteOnboardingRequest(false));

        assertThat(completedAt).isNotNull();
        assertThat(jane.getOnboardingCompletedAt()).isEqualTo(completedAt);
        verify(userRepository).save(jane);
        verify(auditLog).recorded(AuditEvent.ONBOARDING_COMPLETED, id, id, Map.of("skipped", true));
        verify(auditLog).recorded(any(), any(), any(), anyMap());
    }

    @Test
    void updateNotificationSettings_savesAndReturnsTheNewSettings() {
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(userRepository.save(jane)).thenReturn(jane);
        NotificationSettings request = new NotificationSettings(false, true, true, false, true);

        NotificationSettings saved = userService().updateNotificationSettings(id, request);

        assertThat(saved).isEqualTo(request);
        assertThat(jane.isNotifyWaterReminders()).isFalse();
        assertThat(jane.isNotifyFriendNudges()).isFalse();
        verify(auditLog).recorded(eq(AuditEvent.NOTIFICATION_SETTINGS_UPDATED), eq(id), eq(id), anyMap());
    }

    @Test
    void search_saysHowEachResultRelatesToTheSearcher() {
        UUID searcherId = UUID.randomUUID();
        User friend = user("friend");
        User asked = user("asked");
        User asker = user("asker");
        User stranger = user("stranger");
        Friendship accepted = new Friendship(friend.getId(), searcherId);
        ReflectionTestUtils.setField(accepted, "status", Friendship.ACCEPTED);
        when(userRepository.search("a", searcherId, Limit.of(20))).thenReturn(List.of(friend, asked, asker, stranger));
        when(friendshipRepository.findBetween(
                        searcherId, List.of(friend.getId(), asked.getId(), asker.getId(), stranger.getId())))
                .thenReturn(List.of(
                        accepted,
                        new Friendship(searcherId, asked.getId()),
                        new Friendship(asker.getId(), searcherId)));

        assertThat(userService().search(searcherId, "a"))
                .extracting(UserSummaryResponse::friendship)
                .containsExactly("friends", "request_sent", "request_received", null);
    }

    @Test
    void getSummary_returnsTheUserAndHowTheyRelateToTheViewer() {
        UUID viewerId = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.of(jane));
        when(friendshipRepository.findBetween(viewerId, List.of(id)))
                .thenReturn(List.of(new Friendship(id, viewerId)));

        assertThat(userService().getSummary(viewerId, id))
                .isEqualTo(new UserSummaryResponse(id, "jane", null, null, "request_received"));
    }

    private static User user(String username) {
        User user = new User(username, username + "@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        return user;
    }

    @Test
    void search_returnsNothingForABlankOrTooLongQuery() {
        assertThat(userService().search(id, "  ")).isEmpty();
        assertThat(userService().search(id, "a".repeat(31))).isEmpty();
        verifyNoInteractions(userRepository);
    }
}
