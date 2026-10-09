package com.myplunt.user;

import com.myplunt.user.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UserServiceTest {

    @Test
    void toResponse_mapsIdUsernameAndEmailOnly() {
        UUID id = UUID.randomUUID();
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", id);

        UserResponse response = new UserService().toResponse(user);

        assertThat(response).isEqualTo(new UserResponse(id, "jane", "jane@example.com"));
    }
}
