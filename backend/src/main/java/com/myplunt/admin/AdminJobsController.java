package com.myplunt.admin;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.constants.ApiPaths;
import com.myplunt.notification.PushNotificationService;
import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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

    public AdminJobsController(
            Flyway flyway,
            AdminBootstrap adminBootstrap,
            PushNotificationService pushNotificationService,
            AuditLog auditLog) {
        this.flyway = flyway;
        this.adminBootstrap = adminBootstrap;
        this.pushNotificationService = pushNotificationService;
        this.auditLog = auditLog;
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
}
