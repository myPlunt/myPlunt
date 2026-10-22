package com.myplunt.user.dto;

import jakarta.validation.constraints.NotNull;

public record CompleteOnboardingRequest(@NotNull(message = "Skipped must not be blank.") Boolean skipped) {}
