package com.myplunt.storage.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmUploadRequest(@NotBlank(message = "Key must not be blank.") String key) {
}
