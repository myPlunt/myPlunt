package com.myplunt.notification.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// timeZone is the phone's IANA zone ("Europe/Amsterdam"); it decides when the reminders arrive.
public record PushTokenRequest(
        @NotBlank(message = "Push token must not be blank.") @Size(max = 255, message = "Push token is too long.") String token,
        @NotBlank(message = "Time zone must not be blank.") @Size(max = 64, message = "Time zone is too long.") String timeZone) {}
