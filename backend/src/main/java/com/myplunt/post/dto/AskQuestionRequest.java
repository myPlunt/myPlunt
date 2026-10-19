package com.myplunt.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// A question for the user's friends, shown as a sticky note in their feeds.
public record AskQuestionRequest(
        @NotBlank(message = "Question must not be blank.")
                @Size(max = 280, message = "Question must be at most 280 characters.")
                String body,
        // Key of a photo uploaded via /v1/photos/upload-url with category POST; null for no photo.
        @Size(max = 512, message = "Photo key must be at most 512 characters.") String photoKey) {

    // Strip before validation runs, so a question of only spaces counts as blank.
    public AskQuestionRequest {
        body = body == null ? null : body.strip();
    }
}
