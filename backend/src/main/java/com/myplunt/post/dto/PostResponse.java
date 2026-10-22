package com.myplunt.post.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

public record PostResponse(
        UUID id,
        String type,
        UserSummaryResponse author,
        UUID plantId,
        String plantName,
        String body,
        String photoUrl,
        long commentCount,
        long waterCount,
        boolean wateredByMe,
        Instant createdAt) {
}
