package com.myplunt.notification.dto;

import java.time.Instant;
import java.util.UUID;

// One notification in the user's list; url is the app route a tap opens.
public record NotificationResponse(UUID id, String title, String body, String url, Instant createdAt) {
}
