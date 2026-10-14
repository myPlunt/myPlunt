package com.myplunt.admin;

import com.myplunt.admin.dto.AdminLoginRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock
    private AdminUserRepository adminUserRepository;

    @Mock
    private AdminRefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AdminJwtService jwtService;

    private AdminAuthService adminAuthService() {
        return new AdminAuthService(adminUserRepository, refreshTokenRepository, passwordEncoder, jwtService, 12);
    }

    private AdminUser admin() {
        return new AdminUser("admin@myplunt.dev", "admin", "hashed");
    }

    @Test
    void login_issuesSessionAndStoresOnlyTheTokenHash() {
        AdminUser admin = admin();
        admin.setFailedLoginAttempts(3);
        when(adminUserRepository.findByEmail("admin@myplunt.dev")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("correct-password", "hashed")).thenReturn(true);
        when(jwtService.generateAccessToken(admin)).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AdminSession session = adminAuthService().login(new AdminLoginRequest("admin@myplunt.dev", "correct-password"));

        assertThat(session.body().accessToken()).isEqualTo("access-token");
        assertThat(admin.getFailedLoginAttempts()).isZero();
        ArgumentCaptor<AdminRefreshToken> stored = ArgumentCaptor.forClass(AdminRefreshToken.class);
        verify(refreshTokenRepository).save(stored.capture());
        assertThat(stored.getValue().getTokenHash())
                .isEqualTo(AdminAuthService.hash(session.refreshToken()))
                .isNotEqualTo(session.refreshToken());
    }

    @Test
    void login_locksTheAccountAfterTooManyWrongPasswords() {
        AdminUser admin = admin();
        admin.setFailedLoginAttempts(AdminAuthService.MAX_FAILED_ATTEMPTS - 1);
        when(adminUserRepository.findByEmail("admin@myplunt.dev")).thenReturn(Optional.of(admin));
        when(passwordEncoder.matches("wrong-password", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> adminAuthService().login(new AdminLoginRequest("admin@myplunt.dev", "wrong-password")))
                .extracting("statusCode").isEqualTo(HttpStatus.UNAUTHORIZED);

        assertThat(admin.getLockedUntil()).isAfter(Instant.now());
        verify(adminUserRepository).save(admin);
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void login_rejectsALockedAccountEvenWithTheRightPassword() {
        AdminUser admin = admin();
        admin.setLockedUntil(Instant.now().plusSeconds(600));
        when(adminUserRepository.findByEmail("admin@myplunt.dev")).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> adminAuthService().login(new AdminLoginRequest("admin@myplunt.dev", "correct-password")))
                .extracting("statusCode").isEqualTo(HttpStatus.UNAUTHORIZED);

        verify(passwordEncoder, never()).matches("correct-password", "hashed");
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void refresh_rotatesTheTokenAndKeepsTheSessionsEnd() {
        AdminUser admin = admin();
        Instant sessionEnd = Instant.now().plusSeconds(3600);
        AdminRefreshToken stored = new AdminRefreshToken(admin, AdminAuthService.hash("old-token"), sessionEnd);
        when(refreshTokenRepository.findByTokenHash(AdminAuthService.hash("old-token"))).thenReturn(Optional.of(stored));
        when(refreshTokenRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        AdminSession session = adminAuthService().refresh("old-token");

        verify(refreshTokenRepository).delete(stored);
        assertThat(session.refreshToken()).isNotEqualTo("old-token");
        assertThat(session.refreshTokenExpiresAt()).isEqualTo(sessionEnd);
    }

    @Test
    void refresh_rejectsAnExpiredSession() {
        AdminRefreshToken stored = new AdminRefreshToken(admin(), AdminAuthService.hash("old-token"), Instant.now().minusSeconds(1));
        when(refreshTokenRepository.findByTokenHash(AdminAuthService.hash("old-token"))).thenReturn(Optional.of(stored));

        assertThatThrownBy(() -> adminAuthService().refresh("old-token"))
                .extracting("statusCode").isEqualTo(HttpStatus.UNAUTHORIZED);

        verify(refreshTokenRepository).delete(stored);
        verify(refreshTokenRepository, never()).save(any());
    }
}
