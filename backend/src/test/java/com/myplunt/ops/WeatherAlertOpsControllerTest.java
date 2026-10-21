package com.myplunt.ops;

import com.myplunt.auth.JwtService;
import com.myplunt.config.SecurityConfig;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@WebMvcTest(WeatherAlertOpsController.class)
@AutoConfigureRestTestClient
@Import(SecurityConfig.class)
@ActiveProfiles("staging")
@TestPropertySource(properties = "app.ops.reset-secret=test-secret")
class WeatherAlertOpsControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private PushNotificationService pushNotificationService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void sendWeatherAlerts_withCorrectSecret_sendsToEveryone() {
        restTestClient.post().uri("/v1/ops/send-weather-alerts")
                .header("X-Ops-Secret", "test-secret")
                .exchange()
                .expectStatus().isOk();

        verify(pushNotificationService).sendWeatherAlertsToEveryone();
    }

    @Test
    void sendWeatherAlerts_withWrongSecret_isUnauthorizedAndSendsNothing() {
        restTestClient.post().uri("/v1/ops/send-weather-alerts")
                .header("X-Ops-Secret", "nope")
                .exchange()
                .expectStatus().isUnauthorized();

        verify(pushNotificationService, never()).sendWeatherAlertsToEveryone();
    }
}
