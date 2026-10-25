package com.myplunt.admin;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.constants.ApiPaths;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.weather.WeatherCondition;
import com.myplunt.weather.WeatherService;
import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@Profile("staging")
public class AdminJobsController {

    private final Flyway flyway;
    private final AdminBootstrap adminBootstrap;
    private final PushNotificationService pushNotificationService;
    private final AuditLog auditLog;
    private final WeatherService weatherService;
    private final JdbcTemplate jdbc;

    public AdminJobsController(
            Flyway flyway,
            AdminBootstrap adminBootstrap,
            PushNotificationService pushNotificationService,
            AuditLog auditLog,
            WeatherService weatherService,
            JdbcTemplate jdbc) {
        this.flyway = flyway;
        this.adminBootstrap = adminBootstrap;
        this.pushNotificationService = pushNotificationService;
        this.auditLog = auditLog;
        this.weatherService = weatherService;
        this.jdbc = jdbc;
    }

    // clean() drops admin_users too, so the bootstrap admin is recreated and every session ends.
    @PostMapping(ApiPaths.Admin.RESET_DB)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetDb(@AuthenticationPrincipal AdminUser admin) {
        flyway.clean();
        flyway.migrate();
        adminBootstrap.createAdmin();
        auditLog.recorded(AuditEvent.DATABASE_RESET, null, admin.getId(), Map.of());
    }

    @PostMapping(ApiPaths.Admin.SEND_WEATHER_ALERTS)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendWeatherAlerts() {
        pushNotificationService.sendWeatherAlertsToEveryone();
    }

    // Moves everything users did a day into the past, so plants come due and sitting periods run out
    // as if a day passed. Logins, logs and the weather cache keep their real times.
    @PostMapping(ApiPaths.Admin.SKIP_DAY)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void skipDay() {
        jdbc.batchUpdate(
                "UPDATE watering_logs SET watered_at = watered_at - interval '1 day'",
                "UPDATE plants SET created_at = created_at - interval '1 day'",
                "UPDATE plant_photos SET taken_at = taken_at - interval '1 day'",
                "UPDATE care_delegation SET active_from = active_from - interval '1 day', active_until = active_until - interval '1 day'",
                "UPDATE posts SET created_at = created_at - interval '1 day'",
                "UPDATE post_comments SET created_at = created_at - interval '1 day'",
                "UPDATE post_reactions SET created_at = created_at - interval '1 day'",
                "UPDATE notifications SET created_at = created_at - interval '1 day'",
                "UPDATE friendships SET created_at = created_at - interval '1 day'",
                "UPDATE discovered_species SET discovered_at = discovered_at - interval '1 day'",
                "UPDATE user_achievements SET earned_at = earned_at - interval '1 day'");
        pushNotificationService.sendWateringRemindersToEveryone();
    }

    @PostMapping(ApiPaths.Admin.PREVIEW_RAIN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void previewRain() {
        weatherService.preview(WeatherCondition.RAIN);
    }

    @PostMapping(ApiPaths.Admin.PREVIEW_WIND)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void previewWind() {
        weatherService.preview(WeatherCondition.WIND);
    }

    @PostMapping(ApiPaths.Admin.PREVIEW_SNOW)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void previewSnow() {
        weatherService.preview(WeatherCondition.SNOW);
    }
}
