package com.myplunt.notification;

import com.myplunt.constants.ApiPaths;
import com.myplunt.notification.dto.NotificationResponse;
import com.myplunt.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class NotificationController {

    private final PushNotificationService pushNotificationService;

    public NotificationController(PushNotificationService pushNotificationService) {
        this.pushNotificationService = pushNotificationService;
    }

    @GetMapping(ApiPaths.Users.ME_INBOX)
    public List<NotificationResponse> inbox(@AuthenticationPrincipal User principal) {
        return pushNotificationService.getInbox(principal.getId());
    }
}
