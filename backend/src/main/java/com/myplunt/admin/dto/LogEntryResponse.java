package com.myplunt.admin.dto;

import com.fasterxml.jackson.annotation.JsonRawValue;

import java.time.Instant;

public record LogEntryResponse(
        long id,
        String level,
        Instant loggedAt,
        String location,
        String event,
        String message,
        @JsonRawValue String details) {}
