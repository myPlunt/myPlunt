package com.myplunt.user.dto;

import jakarta.validation.constraints.NotBlank;

public record DeleteAccountRequest(
        @NotBlank(message = "Current password must not be blank.") String currentPassword) {
}
