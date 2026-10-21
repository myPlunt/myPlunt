package com.myplunt.notification;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.notification.dto.PushTokenRequest;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(PushTokenController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
class PushTokenControllerTest {

    private static final UUID USER_ID = UUID.randomUUID();

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private PushNotificationService pushNotificationService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @BeforeEach
    void signIn() {
        User user = new User("jane", "jane@example.com", "hashed");
        ReflectionTestUtils.setField(user, "id", USER_ID);
        when(jwtService.parseAndValidate("access-token")).thenReturn(USER_ID);
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
    }

    @Test
    void register_savesTheTokenForTheSignedInUser() {
        restTestClient.put().uri("/v1/users/me/push-token")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new PushTokenRequest("ExponentPushToken[a]", "Europe/Amsterdam"))
                .exchange()
                .expectStatus().isNoContent();

        verify(pushNotificationService).registerToken(USER_ID, new PushTokenRequest("ExponentPushToken[a]", "Europe/Amsterdam"));
    }

    @Test
    void register_returnsFieldErrorsForABlankToken() {
        restTestClient.put().uri("/v1/users/me/push-token")
                .header("Authorization", "Bearer access-token")
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("token", "", "timeZone", "Europe/Amsterdam"))
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.errors.token").isEqualTo("Push token must not be blank.");

        verify(pushNotificationService, never()).registerToken(any(), any());
    }
}
