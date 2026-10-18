package com.myplunt.admin.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;

import java.time.Instant;

// details is the stored JSON, passed through as JSON rather than as a string.
public record LogEntryResponse(
        long id,
        String level,
        Instant loggedAt,
        String location,
        String event,
        String message,
        @JsonRawValue String details) {}
