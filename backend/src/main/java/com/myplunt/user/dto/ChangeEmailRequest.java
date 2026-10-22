package com.myplunt.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ChangeEmailRequest(
        @NotBlank(message = "Email must not be blank.") @Email(message = "Email must be a valid email address.") String email,
        @NotBlank(message = "Current password must not be blank.") String currentPassword) {

    public ChangeEmailRequest {
        email = email == null ? null : email.strip();
    }
}
