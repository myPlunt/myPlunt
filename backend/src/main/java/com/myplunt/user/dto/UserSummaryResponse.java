package com.myplunt.user.dto;

import java.util.UUID;

// Another user as anyone signed in may see them: no email. bio and avatarUrl are null when unset.
public record UserSummaryResponse(UUID id, String username, String bio, String avatarUrl) {
}
