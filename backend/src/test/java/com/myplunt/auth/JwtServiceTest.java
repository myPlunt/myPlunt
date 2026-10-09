package com.myplunt.auth;

import com.myplunt.user.User;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    private User userWithId(UUID id) {
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    @Test
    void generateAccessToken_canBeParsedBackToSameUserId() {
        JwtService jwtService = new JwtService(UUID.randomUUID().toString(), 15);
        UUID userId = UUID.randomUUID();

        String token = jwtService.generateAccessToken(userWithId(userId));

        assertThat(jwtService.parseAndValidate(token)).isEqualTo(userId);
    }

    @Test
    void parseAndValidate_throwsWhenTokenExpired() {
        JwtService jwtService = new JwtService(UUID.randomUUID().toString(), -1);

        String token = jwtService.generateAccessToken(userWithId(UUID.randomUUID()));

        assertThatThrownBy(() -> jwtService.parseAndValidate(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void parseAndValidate_throwsWhenSignedWithDifferentSecret() {
        JwtService issuer = new JwtService(UUID.randomUUID().toString(), 15);
        JwtService verifier = new JwtService(UUID.randomUUID().toString(), 15);

        String token = issuer.generateAccessToken(userWithId(UUID.randomUUID()));

        assertThatThrownBy(() -> verifier.parseAndValidate(token)).isInstanceOf(JwtException.class);
    }

    @Test
    void parseAndValidate_throwsOnGarbageToken() {
        JwtService jwtService = new JwtService(UUID.randomUUID().toString(), 15);

        assertThatThrownBy(() -> jwtService.parseAndValidate("not-a-jwt")).isInstanceOf(JwtException.class);
    }
}
