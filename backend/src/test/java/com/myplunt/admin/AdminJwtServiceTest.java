package com.myplunt.admin;

import com.myplunt.auth.JwtService;
import com.myplunt.user.User;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AdminJwtServiceTest {

    private static final String ADMIN_SECRET = "test-only-admin-secret-test-only-admin-32b";

    @Test
    void parseAndValidate_acceptsItsOwnTokens() {
        AdminUser admin = new AdminUser("admin@myplunt.dev", "admin", "hashed");
        UUID id = UUID.randomUUID();
        ReflectionTestUtils.setField(admin, "id", id);
        AdminJwtService jwtService = new AdminJwtService(ADMIN_SECRET, 15);

        assertThat(jwtService.parseAndValidate(jwtService.generateAccessToken(admin))).isEqualTo(id);
    }

    // Even with the same secret configured for both, an app token lacks the admin audience.
    @Test
    void parseAndValidate_rejectsAnAppUsersToken() {
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", UUID.randomUUID());
        String appToken = new JwtService(ADMIN_SECRET, 15).generateAccessToken(user);

        assertThatThrownBy(() -> new AdminJwtService(ADMIN_SECRET, 15).parseAndValidate(appToken))
                .isInstanceOf(JwtException.class);
    }
}
