package com.myplunt.user.dto;

import java.util.UUID;

// friendship: "friends", "request_sent" (by the viewer), "request_received", or null.
public record UserSummaryResponse(UUID id, String username, String bio, String avatarUrl, String friendship) {
}
