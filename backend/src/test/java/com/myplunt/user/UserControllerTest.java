package com.myplunt.user;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.NotificationSettings;
import com.myplunt.user.dto.UpdateAvatarRequest;
import com.myplunt.user.dto.UpdateLocationRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(UserController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class UserControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void me_returnsTheAuthenticatedUser() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        when(userService.toResponse(user)).thenReturn(new UserResponse(id, "jane", "jane@example.com", null, null, false));

        restTestClient.get().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "jane", "jane@example.com", null, null, false));
    }

    @Test
    void me_rejectsRequestsWithoutAToken() {
        restTestClient.get().uri("/v1/users/me")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    private UUID authenticateAsJane() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        when(jwtService.parseAndValidate("access-token")).thenReturn(id);
        when(userRepository.findById(id)).thenReturn(Optional.of(user));
        return id;
    }

    @Test
    void updateMe_returnsTheUpdatedUser() {
        UUID id = authenticateAsJane();
        UpdateProfileRequest request = new UpdateProfileRequest("janey", "Fern collector");
        when(userService.updateProfile(eq(id), eq(request)))
                .thenReturn(new UserResponse(id, "janey", "jane@example.com", "Fern collector", null, false));

        restTestClient.put().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "janey", "jane@example.com", "Fern collector", null, false));
    }

    @Test
    void updateMe_rejectsBlankUsername() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdateProfileRequest(" ", null))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void changeEmail_returnsTheUpdatedUser() {
        UUID id = authenticateAsJane();
        ChangeEmailRequest request = new ChangeEmailRequest("new@example.com", "password123");
        when(userService.changeEmail(eq(id), eq(request)))
                .thenReturn(new UserResponse(id, "jane", "new@example.com", null, null, false));

        restTestClient.put().uri("/v1/users/me/email")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "jane", "new@example.com", null, null, false));
    }

    @Test
    void changeEmail_propagatesForbiddenFromService() {
        authenticateAsJane();
        when(userService.changeEmail(any(), any()))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "Current password is incorrect"));

        restTestClient.put().uri("/v1/users/me/email")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ChangeEmailRequest("new@example.com", "wrong"))
                .exchange()
                .expectStatus().isForbidden();
    }

    @Test
    void search_returnsTheMatchingUsersWithoutTheirEmail() {
        UUID janeId = authenticateAsJane();
        List<UserSummaryResponse> users = List.of(new UserSummaryResponse(UUID.randomUUID(), "jane_doe", "Fern collector", null, null));
        when(userService.search(janeId, "jan")).thenReturn(users);

        restTestClient.get().uri("/v1/users/search?q=jan")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(new ParameterizedTypeReference<List<UserSummaryResponse>>() {})
                .isEqualTo(users);
    }

    @Test
    void user_returnsAnotherUserForTheSignedInViewer() {
        UUID janeId = authenticateAsJane();
        UUID tomId = UUID.randomUUID();
        UserSummaryResponse tom = new UserSummaryResponse(tomId, "tom", null, null, "friends");
        when(userService.getSummary(janeId, tomId)).thenReturn(tom);

        restTestClient.get().uri("/v1/users/" + tomId)
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserSummaryResponse.class)
                .isEqualTo(tom);
    }

    @Test
    void updateAvatar_returnsTheUserWithTheirNewPicture() {
        UUID id = authenticateAsJane();
        UpdateAvatarRequest request = new UpdateAvatarRequest("avatars/" + id + "/new.jpg");
        UserResponse updated = new UserResponse(id, "jane", "jane@example.com", null, "https://storage/new.jpg", false);
        when(userService.updateAvatar(id, request)).thenReturn(updated);

        restTestClient.put().uri("/v1/users/me/avatar")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(updated);
    }

    @Test
    void removeAvatar_returnsNoContent() {
        UUID id = authenticateAsJane();

        restTestClient.delete().uri("/v1/users/me/avatar")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(userService).removeAvatar(id);
    }

    @Test
    void updateLocation_returnsNoContent() {
        UUID id = authenticateAsJane();
        UpdateLocationRequest request = new UpdateLocationRequest(52.22, 6.89, "Enschede");

        restTestClient.put().uri("/v1/users/me/location")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isNoContent();

        verify(userService).updateLocation(id, request);
    }

    @Test
    void updateLocation_rejectsCoordinatesOutOfRange() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me/location")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdateLocationRequest(200.0, 6.89, "Enschede"))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void updateNotificationSettings_returnsTheSavedSettings() {
        UUID id = authenticateAsJane();
        NotificationSettings request = new NotificationSettings(false, true, true, false, true, true);
        when(userService.updateNotificationSettings(id, request)).thenReturn(request);

        restTestClient.put().uri("/v1/users/me/notifications")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(NotificationSettings.class)
                .isEqualTo(request);
    }

    @Test
    void updateNotificationSettings_rejectsAMissingSetting() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me/notifications")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new NotificationSettings(true, null, true, true, true, true))
                .exchange()
                .expectStatus().isBadRequest();
    }
}
