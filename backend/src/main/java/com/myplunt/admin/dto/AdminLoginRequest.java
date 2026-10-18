package com.myplunt.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminLoginRequest(
        @NotBlank(message = "Email must not be blank.") @Email(message = "Email must be a valid email address.") String email,
        @NotBlank(message = "Password must not be blank.") String password) {
}
