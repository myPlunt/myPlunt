package com.myplunt.notification.dto;

import java.time.Instant;
import java.util.UUID;

// One notification in the user's list; url is the app route a tap opens. fromUserId is who it's
// from (null for the app's own, like watering reminders); fromAvatarUrl is null when they have no picture.
public record NotificationResponse(
        UUID id, UUID fromUserId, String fromAvatarUrl, String title, String body, String url, Instant createdAt) {
}
