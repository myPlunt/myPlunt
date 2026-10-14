package com.myplunt.user.dto;

import java.util.UUID;

// Another user as anyone signed in may see them: no email. bio and avatarUrl are null when unset.
// friendship is how they relate to the viewer: "friends", "request_sent" (the viewer asked),
// "request_received" (they asked the viewer), or null when neither has asked.
public record UserSummaryResponse(UUID id, String username, String bio, String avatarUrl, String friendship) {
}
