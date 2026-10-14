package com.myplunt.auth;

import com.myplunt.auth.dto.AuthResponse;
import com.myplunt.auth.dto.LoginRequest;
import com.myplunt.auth.dto.RegisterRequest;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
<<<<<<< HEAD
import com.myplunt.common.logging.LogMasking;
=======
>>>>>>> origin/dev
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditLog auditLog;
    private final Duration refreshTokenTtl;

    public AuthService(
            UserRepository userRepository,
            RefreshTokenRepository refreshTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuditLog auditLog,
            @Value("${app.jwt.refresh-token-ttl-days}") long refreshTokenTtlDays) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.auditLog = auditLog;
        this.refreshTokenTtl = Duration.ofDays(refreshTokenTtlDays);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            auditLog.rejected(AuditEvent.REGISTRATION_REJECTED, null, "email_in_use",
<<<<<<< HEAD
                    Map.of("email", LogMasking.email(request.email())));
=======
                    Map.of("email", request.email()));
>>>>>>> origin/dev
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        if (userRepository.findByUsername(request.username()).isPresent()) {
            auditLog.rejected(AuditEvent.REGISTRATION_REJECTED, null, "username_taken",
<<<<<<< HEAD
                    Map.of("username", LogMasking.username(request.username())));
=======
                    Map.of("username", request.username()));
>>>>>>> origin/dev
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        User user = userRepository.save(new User(
                request.username(), request.email(), passwordEncoder.encode(request.password())));
        auditLog.recorded(AuditEvent.USER_REGISTERED, user.getId(), user.getId(),
<<<<<<< HEAD
                Map.of("email", LogMasking.email(user.getEmail())));
=======
                Map.of("email", user.getEmail()));
>>>>>>> origin/dev

        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user == null) {
            auditLog.rejected(AuditEvent.LOGIN_FAILED, null, "unknown_email",
<<<<<<< HEAD
                    Map.of("email", LogMasking.email(request.email())));
=======
                    Map.of("email", request.email()));
>>>>>>> origin/dev
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            auditLog.rejected(AuditEvent.LOGIN_FAILED, user.getId(), "wrong_password", Map.of());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        auditLog.recorded(AuditEvent.LOGIN_SUCCEEDED, user.getId(), user.getId(), Map.of());

        return issueTokens(user);
    }

    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken).ifPresent(token -> {
            refreshTokenRepository.delete(token);
            UUID userId = token.getUser().getId();
            auditLog.recorded(AuditEvent.LOGGED_OUT, userId, userId, Map.of());
        });
    }

    public AuthResponse refresh(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token).orElse(null);
        if (refreshToken == null) {
            auditLog.rejected(AuditEvent.SESSION_REFRESH_REJECTED, null, "unknown_token", Map.of());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        refreshTokenRepository.delete(refreshToken);
        User user = refreshToken.getUser();

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            auditLog.rejected(AuditEvent.SESSION_REFRESH_REJECTED, user.getId(), "expired", Map.of());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        AuthResponse tokens = issueTokens(user);
        auditLog.recorded(AuditEvent.SESSION_REFRESHED, user.getId(), user.getId(), Map.of());
        return tokens;
    }

    private AuthResponse issueTokens(User user) {
        RefreshToken refreshToken = refreshTokenRepository.save(
                new RefreshToken(user, UUID.randomUUID().toString(), Instant.now().plus(refreshTokenTtl)));

        return new AuthResponse(jwtService.generateAccessToken(user), refreshToken.getToken());
    }
}
