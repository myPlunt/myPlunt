package com.myplunt.admin;

import com.myplunt.admin.dto.AdminAuthResponse;
import com.myplunt.admin.dto.AdminLoginRequest;
import com.myplunt.admin.dto.AdminResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

// Admin sign-in. Every failure answers the same "Invalid credentials", whether the email is
// unknown, the password wrong or the account locked, so the endpoint can't be used to find out
// which admin emails exist. Not @Transactional: a failed attempt must stay counted when the
// request ends in an error. Nothing the admin app does is logged (see CLAUDE.md).
@Service
public class AdminAuthService {

    static final int MAX_FAILED_ATTEMPTS = 5;
    static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private static final SecureRandom RANDOM = new SecureRandom();

    private final AdminUserRepository adminUserRepository;
    private final AdminRefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminJwtService jwtService;
    private final Duration sessionTtl;
    // Checked against when the email is unknown, so that answer takes as long as a wrong password.
    private final String dummyHash;

    public AdminAuthService(
            AdminUserRepository adminUserRepository,
            AdminRefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            AdminJwtService jwtService,
            @Value("${app.admin.session-ttl-hours}") long sessionTtlHours) {
        this.adminUserRepository = adminUserRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.sessionTtl = Duration.ofHours(sessionTtlHours);
        this.dummyHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    public AdminSession login(AdminLoginRequest request) {
        AdminUser admin = adminUserRepository.findByEmail(request.email()).orElse(null);
        if (admin == null) {
            passwordEncoder.matches(request.password(), dummyHash);
            throw invalidCredentials();
        }
        Instant now = Instant.now();
        if (admin.getLockedUntil() != null && admin.getLockedUntil().isAfter(now)) {
            throw invalidCredentials();
        }
        if (!passwordEncoder.matches(request.password(), admin.getPasswordHash())) {
            int attempts = admin.getFailedLoginAttempts() + 1;
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                admin.setFailedLoginAttempts(0);
                admin.setLockedUntil(now.plus(LOCK_DURATION));
            } else {
                admin.setFailedLoginAttempts(attempts);
            }
            adminUserRepository.save(admin);
            throw invalidCredentials();
        }

        admin.setFailedLoginAttempts(0);
        admin.setLockedUntil(null);
        admin.setLastLoginAt(now);
        adminUserRepository.save(admin);
        refreshTokenRepository.deleteByAdminAndExpiresAtBefore(admin, now);

        return issueSession(admin, now.plus(sessionTtl));
    }

    // The old token is used up either way (rotation), so a stolen one works at most once.
    public AdminSession refresh(String refreshToken) {
        AdminRefreshToken stored = refreshToken == null || refreshToken.isBlank()
                ? null
                : refreshTokenRepository.findByTokenHash(hash(refreshToken)).orElse(null);
        if (stored == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please log in again.");
        }
        refreshTokenRepository.delete(stored);
        if (!stored.getExpiresAt().isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Your session has ended. Please log in again.");
        }

        return issueSession(stored.getAdmin(), stored.getExpiresAt());
    }

    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(hash(refreshToken)).ifPresent(refreshTokenRepository::delete);
    }

    public static AdminResponse toResponse(AdminUser admin) {
        return new AdminResponse(admin.getId(), admin.getEmail(), admin.getDisplayName());
    }

    private AdminSession issueSession(AdminUser admin, Instant expiresAt) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        refreshTokenRepository.save(new AdminRefreshToken(admin, hash(refreshToken), expiresAt));

        AdminAuthResponse body = new AdminAuthResponse(jwtService.generateAccessToken(admin), toResponse(admin));
        return new AdminSession(body, refreshToken, expiresAt);
    }

    static String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private static ResponseStatusException invalidCredentials() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
}
