package com.myplunt.auth;

import com.myplunt.auth.dto.AuthResponse;
import com.myplunt.auth.dto.LoginRequest;
import com.myplunt.auth.dto.RegisterRequest;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.user.User;
import com.myplunt.user.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserService userService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuditLog auditLog;

    private AuthService authService() {
        return new AuthService(userService, refreshTokenRepository, passwordEncoder, jwtService, auditLog, 30);
    }

    @Test
    void register_savesUserAndIssuesTokens() {
        when(userService.findByEmail("jane@example.com")).thenReturn(Optional.empty());
        when(userService.findByUsername("jane")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("hashed");
        UUID userId = UUID.randomUUID();
        User jane = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(jane, "id", userId);
        when(userService.create("jane", "jane@example.com", "hashed")).thenReturn(jane);
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateAccessToken(any())).thenReturn("access-token");

        AuthResponse response = authService().register(new RegisterRequest("jane", "jane@example.com", "password123"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isNotBlank();
    }

    @Test
    void register_throwsConflictWhenEmailAlreadyRegistered() {
        when(userService.findByEmail("jane@example.com"))
                .thenReturn(Optional.of(new User("jane", "jane@example.com", "hashed")));

        assertThatThrownBy(() -> authService().register(new RegisterRequest("jane2", "jane@example.com", "password123")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.CONFLICT);

        verify(userService, never()).create(any(), any(), any());
    }

    @Test
    void login_returnsTokensForValidCredentials() {
        User user = new User("jane", "jane@example.com", "hashed");
        UUID userId = UUID.randomUUID();
        ReflectionTestUtils.setField(user, "id", userId);
        when(userService.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password123", "hashed")).thenReturn(true);
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateAccessToken(user)).thenReturn("access-token");

        AuthResponse response = authService().login(new LoginRequest("jane@example.com", "password123"));

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.refreshToken()).isNotBlank();
    }

    @Test
    void login_throwsUnauthorizedWhenPasswordIncorrect() {
        User user = new User("jane", "jane@example.com", "hashed");
        UUID userId = UUID.randomUUID();
        ReflectionTestUtils.setField(user, "id", userId);
        when(userService.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService().login(new LoginRequest("jane@example.com", "wrong")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refresh_returnsNewTokensForValidRefreshToken() {
        User user = new User("jane", "jane@example.com", "hashed");
        UUID userId = UUID.randomUUID();
        ReflectionTestUtils.setField(user, "id", userId);
        RefreshToken refreshToken = new RefreshToken(user, "refresh-token", Instant.now().plusSeconds(60));
        when(refreshTokenRepository.findByToken("refresh-token")).thenReturn(Optional.of(refreshToken));
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtService.generateAccessToken(user)).thenReturn("new-access-token");

        AuthResponse response = authService().refresh("refresh-token");

        assertThat(response.accessToken()).isEqualTo("new-access-token");
        assertThat(response.refreshToken()).isNotBlank();
        verify(refreshTokenRepository).delete(refreshToken);
    }

    @Test
    void refresh_throwsUnauthorizedAndDeletesTokenWhenExpired() {
        User user = new User("jane", "jane@example.com", "hashed");
        UUID userId = UUID.randomUUID();
        ReflectionTestUtils.setField(user, "id", userId);
        RefreshToken refreshToken = new RefreshToken(user, "expired-token", Instant.now().minusSeconds(60));
        when(refreshTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(refreshToken));

        assertThatThrownBy(() -> authService().refresh("expired-token"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        verify(refreshTokenRepository).delete(refreshToken);
    }
}
