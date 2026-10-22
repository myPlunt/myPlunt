package com.myplunt.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AskQuestionRequest(
        @NotBlank(message = "Question must not be blank.")
                @Size(max = 280, message = "Question must be at most 280 characters.")
                String body,
        @Size(max = 512, message = "Photo key must be at most 512 characters.") String photoKey) {

    public AskQuestionRequest {
        body = body == null ? null : body.strip();
    }
}
