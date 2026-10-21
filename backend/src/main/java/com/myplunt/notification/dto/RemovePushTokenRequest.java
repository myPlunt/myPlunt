package com.myplunt.notification.dto;

import jakarta.validation.constraints.NotBlank;

public record RemovePushTokenRequest(@NotBlank(message = "Push token must not be blank.") String token) {}
