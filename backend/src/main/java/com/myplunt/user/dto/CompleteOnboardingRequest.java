package com.myplunt.user.dto;

import jakarta.validation.constraints.NotNull;

// skipped is true when the user left from the welcome page instead of going through the tour.
public record CompleteOnboardingRequest(@NotNull(message = "Skipped must not be blank.") Boolean skipped) {}
