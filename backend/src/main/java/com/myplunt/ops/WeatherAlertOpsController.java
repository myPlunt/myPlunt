package com.myplunt.ops;

import com.myplunt.constants.ApiPaths;
import com.myplunt.notification.PushNotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@Profile("staging")
public class WeatherAlertOpsController {

    private final PushNotificationService pushNotificationService;
    private final String opsSecret;

    public WeatherAlertOpsController(
            PushNotificationService pushNotificationService, @Value("${app.ops.reset-secret}") String opsSecret) {
        this.pushNotificationService = pushNotificationService;
        this.opsSecret = opsSecret;
    }

    @PostMapping(ApiPaths.Ops.SEND_WEATHER_ALERTS)
    @ResponseStatus(HttpStatus.OK)
    public void sendWeatherAlerts(@RequestHeader("X-Ops-Secret") String providedSecret) {
        if (!MessageDigest.isEqual(
                providedSecret.getBytes(StandardCharsets.UTF_8), opsSecret.getBytes(StandardCharsets.UTF_8))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        pushNotificationService.sendWeatherAlertsToEveryone();
    }
}
