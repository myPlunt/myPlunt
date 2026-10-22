package com.myplunt.post.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.time.Instant;
import java.util.UUID;

// One post in the feed. type is a Post constant ("new_plant", "new_photo", "question"); photoUrl
// is the shared photo, or for a new plant its current one; null when there's none. body is a
// question's text or a new photo's optional comment; a new plant has none. A question has no
// plant (plantId and plantName are null). commentCount is how many comments it has,
// waterCount how many drops (likes) friends gave it, and wateredByMe whether the viewer gave one.
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
