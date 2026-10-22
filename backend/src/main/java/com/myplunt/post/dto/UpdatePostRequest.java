package com.myplunt.post.dto;

import jakarta.validation.constraints.Size;

public record UpdatePostRequest(@Size(max = 280, message = "Text must be at most 280 characters.") String body) {

    public UpdatePostRequest {
        body = body == null ? null : body.strip();
    }
}
