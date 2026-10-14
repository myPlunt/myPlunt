package com.myplunt.common.logging.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

// The device the lines come from, once per batch, and the lines themselves.
public record ClientLogBatch(
        @NotBlank(message = "Platform must not be blank.")
        @Pattern(regexp = "ios|android|web", message = "Platform must be ios, android or web.") String platform,
        @Size(max = 32, message = "OS version must be at most 32 characters.") String osVersion,
        @Size(max = 64, message = "Device model must be at most 64 characters.") String deviceModel,
        @Size(max = 32, message = "App version must be at most 32 characters.") String appVersion,
        @NotEmpty(message = "Entries must not be empty.")
        @Size(max = 50, message = "Entries must be at most 50 per request.")
        List<@Valid @NotNull(message = "Entries must not contain null.") ClientLogEntry> entries) {
}
