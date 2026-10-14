package com.myplunt.auth;

import com.myplunt.auth.dto.AuthResponse;
import com.myplunt.auth.dto.LoginRequest;
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

}
