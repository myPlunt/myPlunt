package com.myplunt.post.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

// One post in the feed. type is a Post constant ("new_plant", "new_photo"); photoUrl is the shared
// photo, or for a new plant its current one; null when there's none.
public record PostResponse(
        UUID id,
        String type,
        UserSummaryResponse author,
        UUID plantId,
        String plantName,
        String photoUrl,
        Instant createdAt) {
}
