package com.myplunt.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Username must not be blank.")
                @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters.")
                @Pattern(regexp = "^[a-zA-Z0-9_.]*$", message = "Username may only contain letters, numbers, dots and underscores.")
                String username,
        @NotBlank(message = "Email must not be blank.") @Email(message = "Email must be a valid email address.") String email,
        @NotBlank(message = "Password must not be blank.")
                @Size(min = 8, message = "Password must be at least 8 characters.") String password) {

    // Strip so " alice" can't pass as "alice". The password keeps its spaces on purpose.
    public RegisterRequest {
        username = username == null ? null : username.strip();
        email = email == null ? null : email.strip();
    }
}
