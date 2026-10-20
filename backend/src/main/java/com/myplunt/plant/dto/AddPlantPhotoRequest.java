package com.myplunt.plant.dto;

import com.myplunt.post.Post;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.Instant;

// A new growth photo for the plant's timeline. takenAt is when the photo was taken (from a
// library photo's metadata); null means now. comment goes with the feed post ("A new flower is
// blooming!"), so it's only kept when shareToFeed is true; the photo's own note is set from Edit photo.
public record AddPlantPhotoRequest(
        @NotBlank(message = "Photo key must not be blank.")
                @Size(max = 512, message = "Photo key must be at most 512 characters.")
                String photoKey,
        @PastOrPresent(message = "The photo can't be taken in the future.") Instant takenAt,
        @Size(max = Post.COMMENT_MAX_LENGTH, message = "Comment must be at most 120 characters.") String comment,
        // Posts the photo to friends' feeds. A Boolean, so older apps that leave it out still
        // work (Jackson rejects a missing primitive); null counts as false.
        Boolean shareToFeed) {
}
