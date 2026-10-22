package com.myplunt.storage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UploadUrlRequest(
        @NotNull(message = "Category must not be null.") PhotoCategory category,
        @NotBlank(message = "Content type must not be blank.") String contentType) {
}
