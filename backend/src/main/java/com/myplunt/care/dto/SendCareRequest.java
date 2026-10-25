package com.myplunt.care.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

// until is exclusive: the start of the day after the last day away.
public record SendCareRequest(
        @NotNull(message = "Sitter must not be empty.") UUID sitterId,
        @NotNull(message = "Start date must not be empty.") Instant from,
        @NotNull(message = "End date must not be empty.") Instant until) {
}
