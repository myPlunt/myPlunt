package com.myplunt.notification;

import com.myplunt.constants.ApiPaths;
import com.myplunt.notification.dto.PushTokenRequest;
import com.myplunt.notification.dto.RemovePushTokenRequest;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PushTokenController {

    private final PushNotificationService pushNotificationService;

    public PushTokenController(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @PutMapping(ApiPaths.Users.ME_PUSH_TOKEN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@AuthenticationPrincipal User principal, @Valid @RequestBody PushTokenRequest request) {
        pushNotificationService.registerToken(principal.getId(), request);
    }

    @DeleteMapping(ApiPaths.Users.ME_PUSH_TOKEN)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal User principal, @Valid @RequestBody RemovePushTokenRequest request) {
        pushNotificationService.removeToken(principal.getId(), request.token());
    }
}
