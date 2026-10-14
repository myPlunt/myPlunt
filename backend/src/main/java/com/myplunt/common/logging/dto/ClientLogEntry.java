package com.myplunt.common.logging.dto;

import com.myplunt.common.logging.ClientLogType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Map;

// One line the app logged. timestamp is when it happened on the device (the app sends its lines
// in batches). requestId links it to the backend's lines for the same request. context holds the
// event's own fields (status, field names, ids); the app never puts personal data in it.
public record ClientLogEntry(
        @NotNull(message = "Timestamp must not be null.") Instant timestamp,
        @NotNull(message = "Type must not be null.") ClientLogType type,
        @NotBlank(message = "Event must not be blank.")
        @Pattern(regexp = "[a-z][a-z0-9_]{0,63}", message = "Event must be snake_case, at most 64 characters.") String event,
        @Pattern(regexp = "[A-Za-z0-9-]{8,64}", message = "Request id must be 8 to 64 letters, digits or dashes.") String requestId,
        @Size(max = 200, message = "Route must be at most 200 characters.") String route,
        @Size(max = 1000, message = "Message must be at most 1000 characters.") String message,
        @Size(max = 20, message = "Context must have at most 20 fields.")
        Map<@Pattern(regexp = "[a-z][a-z0-9_]{0,39}", message = "Context keys must be snake_case, at most 40 characters.") String,
                @Size(max = 500, message = "Context values must be at most 500 characters.") String> context,
        @Size(max = 8000, message = "Stack trace must be at most 8000 characters.") String stackTrace) {
}
