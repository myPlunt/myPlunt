package com.myplunt.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddCommentRequest(
        @NotBlank(message = "Comment must not be blank.")
                @Size(max = 500, message = "Comment must be at most 500 characters.")
                String body) {

    // Strip before validation runs, so a comment of only spaces counts as blank.
    public AddCommentRequest {
        body = body == null ? null : body.strip();
    }
}
