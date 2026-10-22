package com.myplunt.plant.dto;

import com.myplunt.post.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.Instant;

// takenAt null means now. comment belongs to the feed post, so it's dropped unless shareToFeed.
public record AddPlantPhotoRequest(
        @NotBlank(message = "Photo key must not be blank.")
                @Size(max = 512, message = "Photo key must be at most 512 characters.")
                String photoKey,
        @PastOrPresent(message = "The photo can't be taken in the future.") Instant takenAt,
        @Size(max = Post.COMMENT_MAX_LENGTH, message = "Comment must be at most 120 characters.") String comment,
        // Boolean, not boolean: older apps leave it out, and Jackson rejects a missing primitive.
        Boolean shareToFeed) {
}
