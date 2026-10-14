package com.myplunt.auth;

import com.myplunt.auth.dto.AuthResponse;
import com.myplunt.auth.dto.LoginRequest;
import com.myplunt.auth.dto.LogoutRequest;
import com.myplunt.auth.dto.RefreshRequest;
import com.myplunt.auth.dto.RegisterRequest;
import com.myplunt.config.SecurityConfig;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(AuthController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private AuthService authService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void register_returnsCreatedTokens() {
        when(authService.register(any())).thenReturn(new AuthResponse("access-token", "refresh-token"));

        restTestClient.post().uri("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegisterRequest("jane", "jane@example.com", "password123"))
                .exchange()
                .expectStatus().isCreated()
                .expectBody(AuthResponse.class)
                .isEqualTo(new AuthResponse("access-token", "refresh-token"));
    }

    @Test
    void register_rejectsInvalidEmail() {
        restTestClient.post().uri("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegisterRequest("jane", "not-an-email", "password123"))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void register_stripsSurroundingWhitespaceFromUsernameAndEmail() {
        when(authService.register(eq(new RegisterRequest("jane", "jane@example.com", " password123 "))))
                .thenReturn(new AuthResponse("access-token", "refresh-token"));

        // The password keeps its spaces: they are part of what the user chose.
        restTestClient.post().uri("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"username\": \" jane \", \"email\": \" jane@example.com \", \"password\": \" password123 \"}")
                .exchange()
                .expectStatus().isCreated()
                .expectBody(AuthResponse.class)
                .isEqualTo(new AuthResponse("access-token", "refresh-token"));
    }

    @Test
    void register_rejectsUsernameShorterThan3Characters() {
        restTestClient.post().uri("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegisterRequest("ja", "jane@example.com", "password123"))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void register_rejectsUsernameLongerThan30Characters() {
        restTestClient.post().uri("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegisterRequest("j".repeat(31), "jane@example.com", "password123"))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void register_rejectsUsernameWithDisallowedCharacters() {
        // Inner space, and a Cyrillic "а" that looks like a Latin "a".
        for (String username : new String[] {"jane doe", "j\u0430ne"}) {
            restTestClient.post().uri("/v1/auth/register")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new RegisterRequest(username, "jane@example.com", "password123"))
                    .exchange()
                    .expectStatus().isBadRequest();
        }
    }

    @Test
    void register_rejectsShortPassword() {
        restTestClient.post().uri("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegisterRequest("jane", "jane@example.com", "short"))
                .exchange()
                .expectStatus().isBadRequest();
    }

    // Logs end up in the error log file (and later a database), so a rejected
    // password must never be written to them.
    @Test
    void register_propagatesConflictFromService() {
        when(authService.register(any()))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered"));

        restTestClient.post().uri("/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RegisterRequest("jane", "jane@example.com", "password123"))
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void login_returnsTokens() {
        when(authService.login(any())).thenReturn(new AuthResponse("access-token", "refresh-token"));

        restTestClient.post().uri("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("jane@example.com", "password123"))
                .exchange()
                .expectStatus().isOk()
                .expectBody(AuthResponse.class)
                .isEqualTo(new AuthResponse("access-token", "refresh-token"));
    }

    @Test
    void login_propagatesUnauthorizedFromService() {
        when(authService.login(any()))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        restTestClient.post().uri("/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LoginRequest("jane@example.com", "wrong"))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void logout_returnsNoContentAndDelegatesToService() {
        restTestClient.post().uri("/v1/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LogoutRequest("refresh-token"))
                .exchange()
                .expectStatus().isNoContent();

        verify(authService).logout(eq("refresh-token"));
    }

    @Test
    void logout_rejectsBlankRefreshToken() {
        restTestClient.post().uri("/v1/auth/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new LogoutRequest(" "))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void refresh_returnsNewTokens() {
        when(authService.refresh(any())).thenReturn(new AuthResponse("new-access-token", "new-refresh-token"));

        restTestClient.post().uri("/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RefreshRequest("refresh-token"))
                .exchange()
                .expectStatus().isOk()
                .expectBody(AuthResponse.class)
                .isEqualTo(new AuthResponse("new-access-token", "new-refresh-token"));
    }

    @Test
    void refresh_propagatesUnauthorizedFromService() {
        when(authService.refresh(any()))
                .thenThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        restTestClient.post().uri("/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RefreshRequest("bad-token"))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    @Test
    void refresh_rejectsBlankRefreshToken() {
        restTestClient.post().uri("/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new RefreshRequest(" "))
                .exchange()
                .expectStatus().isBadRequest();
    }
}
