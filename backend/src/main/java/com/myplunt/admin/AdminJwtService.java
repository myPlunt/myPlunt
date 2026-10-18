package com.myplunt.admin;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

// Access tokens for the admin dashboard. Signed with their own secret (not app.jwt.secret) and
// checked for their own audience, so an app user's token can never pass as an admin's, even if
// both secrets were set to the same value by mistake.
@Service
public class AdminJwtService {

    static final String AUDIENCE = "myplunt-admin";

    private final SecretKey key;
    private final Duration accessTokenTtl;

    // hmacShaKeyFor refuses secrets shorter than 32 bytes, so a weak secret stops the backend from starting.
    public AdminJwtService(
            @Value("${app.admin.jwt.secret}") String secret,
            @Value("${app.admin.jwt.access-token-ttl-minutes}") long accessTokenTtlMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenTtl = Duration.ofMinutes(accessTokenTtlMinutes);
    }

    public String generateAccessToken(AdminUser admin) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(admin.getId().toString())
                .audience().add(AUDIENCE).and()
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenTtl)))
                .signWith(key)
                .compact();
    }

    public UUID parseAndValidate(String accessToken) {
        String subject = Jwts.parser()
                .verifyWith(key)
                .requireAudience(AUDIENCE)
                .build()
                .parseSignedClaims(accessToken)
                .getPayload()
                .getSubject();
        return UUID.fromString(subject);
    }
}
