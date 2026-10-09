package com.myplunt.user;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
        when(userService.toResponse(user)).thenReturn(new UserResponse(id, "jane", "jane@example.com", null));

        restTestClient.get().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "jane", "jane@example.com", null));
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
                .thenReturn(new UserResponse(id, "janey", "jane@example.com", "Fern collector"));

        restTestClient.put().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "janey", "jane@example.com", "Fern collector"));
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
    void updateMe_rejectsBioOver255Characters() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdateProfileRequest("jane", "a".repeat(256)))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void updateMe_stripsSurroundingWhitespaceFromUsername() {
        UUID id = authenticateAsJane();
        when(userService.updateProfile(eq(id), eq(new UpdateProfileRequest("janey", null))))
                .thenReturn(new UserResponse(id, "janey", "jane@example.com", null));

        restTestClient.put().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"username\": \"  janey  \", \"bio\": null}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "janey", "jane@example.com", null));
    }

    @Test
    void updateMe_rejectsUsernameShorterThan3Characters() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdateProfileRequest("ja", null))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void updateMe_rejectsUsernameLongerThan30Characters() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdateProfileRequest("j".repeat(31), null))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void updateMe_rejectsUsernameWithDisallowedCharacters() {
        authenticateAsJane();

        // Inner space, and a Cyrillic "а" that looks like a Latin "a".
        for (String username : new String[] {"jane doe", "j\u0430ne"}) {
            restTestClient.put().uri("/v1/users/me")
                    .header("Authorization", "Bearer access-token")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new UpdateProfileRequest(username, null))
                    .exchange()
                    .expectStatus().isBadRequest();
        }
    }

    @Test
    void updateMe_rejectsRequestsWithoutAToken() {
        restTestClient.put().uri("/v1/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new UpdateProfileRequest("jane", null))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void changeEmail_returnsTheUpdatedUser() {
        UUID id = authenticateAsJane();
        ChangeEmailRequest request = new ChangeEmailRequest("new@example.com", "password123");
        when(userService.changeEmail(eq(id), eq(request)))
                .thenReturn(new UserResponse(id, "jane", "new@example.com", null));

        restTestClient.put().uri("/v1/users/me/email")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "jane", "new@example.com", null));
    }

    @Test
    void changeEmail_stripsSurroundingWhitespaceFromEmail() {
        UUID id = authenticateAsJane();
        when(userService.changeEmail(eq(id), eq(new ChangeEmailRequest("new@example.com", "password123"))))
                .thenReturn(new UserResponse(id, "jane", "new@example.com", null));

        restTestClient.put().uri("/v1/users/me/email")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"email\": \"  new@example.com \", \"currentPassword\": \"password123\"}")
                .exchange()
                .expectStatus().isOk()
                .expectBody(UserResponse.class)
                .isEqualTo(new UserResponse(id, "jane", "new@example.com", null));
    }

    @Test
    void changeEmail_rejectsInvalidEmail() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me/email")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ChangeEmailRequest("not-an-email", "password123"))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void changeEmail_rejectsBlankCurrentPassword() {
        authenticateAsJane();

        restTestClient.put().uri("/v1/users/me/email")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ChangeEmailRequest("new@example.com", " "))
                .exchange()
                .expectStatus().isBadRequest();
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
    void changeEmail_rejectsRequestsWithoutAToken() {
        restTestClient.put().uri("/v1/users/me/email")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new ChangeEmailRequest("new@example.com", "password123"))
                .exchange()
                .expectStatus().isUnauthorized();
    }
}
