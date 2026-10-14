package com.myplunt.common.logging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// details is the error's text (name, message, stack) or the failed response body; the app
// trims it to fit before sending.
public record ClientLogRequest(
        @NotBlank(message = "Message must not be blank.") @Size(max = 1000, message = "Message must be at most 1000 characters.") String message,
        @Size(max = 8000, message = "Details must be at most 8000 characters.") String details,
        @NotBlank(message = "Platform must not be blank.") @Pattern(regexp = "ios|android|web", message = "Platform must be ios, android or web.") String platform,
        @Size(max = 32, message = "App version must be at most 32 characters.") String appVersion) {
}
