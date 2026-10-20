package com.myplunt.post.dto;

import jakarta.validation.constraints.Size;

// New text for the user's own post: a question's text, or a new photo's comment (blank removes
// it). The service checks the rest per type, since one field means different things.
public record UpdatePostRequest(@Size(max = 280, message = "Text must be at most 280 characters.") String body) {

    // Strip before validation runs, so text of only spaces counts as blank.
    public UpdatePostRequest {
        body = body == null ? null : body.strip();
    }
}
