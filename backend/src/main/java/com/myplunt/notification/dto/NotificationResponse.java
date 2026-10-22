package com.myplunt.notification.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id, UUID fromUserId, String fromAvatarUrl, String title, String body, String url, Instant createdAt) {
}
