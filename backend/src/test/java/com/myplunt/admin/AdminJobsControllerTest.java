package com.myplunt.admin;

import com.myplunt.auth.JwtService;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.config.AdminSecurityConfig;
import com.myplunt.config.SecurityConfig;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.user.UserRepository;
import com.myplunt.weather.WeatherCondition;
import com.myplunt.weather.WeatherService;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureRestTestClient;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.client.RestTestClient;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@WebMvcTest(AdminJobsController.class)
@AutoConfigureRestTestClient
@Import({SecurityConfig.class, AdminSecurityConfig.class})
@ActiveProfiles("staging")
@TestPropertySource(properties = "app.admin.allowed-origins=https://admin.myplunt.test")
class AdminJobsControllerTest {

    @Autowired
    private RestTestClient restTestClient;

    @MockitoBean
    private Flyway flyway;

    @MockitoBean
    private AdminBootstrap adminBootstrap;

    @MockitoBean
    private PushNotificationService pushNotificationService;

    @MockitoBean
    private AuditLog auditLog;

    @MockitoBean
    private WeatherService weatherService;

    @MockitoBean
    private AdminJwtService adminJwtService;

    @MockitoBean
    private AdminUserRepository adminUserRepository;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    void resetDb_cleansMigratesThenRecreatesTheAdmin() {
        signedInAdmin();

        restTestClient.post().uri("/v1/admin/jobs/reset-db")
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .exchange()
                .expectStatus().isNoContent();

        InOrder order = inOrder(flyway, adminBootstrap);
        order.verify(flyway).clean();
        order.verify(flyway).migrate();
        order.verify(adminBootstrap).createAdmin();
    }

    @Test
    void resetDb_withoutAnAdmin_isUnauthorizedAndSkipsReset() {
        restTestClient.post().uri("/v1/admin/jobs/reset-db")
                .exchange()
                .expectStatus().isUnauthorized();

        verify(flyway, never()).clean();
    }

    @Test
    void sendWeatherAlerts_sendsToEveryone() {
        signedInAdmin();

        restTestClient.post().uri("/v1/admin/jobs/send-weather-alerts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(pushNotificationService).sendWeatherAlertsToEveryone();
    }

    @Test
    void sendWeatherAlerts_withoutAnAdmin_isUnauthorizedAndSendsNothing() {
        restTestClient.post().uri("/v1/admin/jobs/send-weather-alerts")
                .exchange()
                .expectStatus().isUnauthorized();

        verify(pushNotificationService, never()).sendWeatherAlertsToEveryone();
    }

    @Test
    void previewSnow_showsSnowToEveryone() {
        signedInAdmin();

        restTestClient.post().uri("/v1/admin/jobs/preview-snow")
                .header(HttpHeaders.AUTHORIZATION, "Bearer admin-token")
                .exchange()
                .expectStatus().isNoContent();

        verify(weatherService).preview(WeatherCondition.SNOW);
    }

    private void signedInAdmin() {
        UUID id = UUID.randomUUID();
        when(adminJwtService.parseAndValidate("admin-token")).thenReturn(id);
        when(adminUserRepository.findById(id)).thenReturn(Optional.of(new AdminUser("admin@myplunt.dev", "admin", "hashed")));
    }
}
