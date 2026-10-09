package com.myplunt.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Username must not be blank.")
                @Size(min = 3, max = 30, message = "Username must be between 3 and 30 characters.")
                @Pattern(regexp = "^[a-zA-Z0-9_.]*$", message = "Username may only contain letters, numbers, dots and underscores.")
                String username,
        @Size(max = 255, message = "Bio must be at most 255 characters.") String bio) {

    // Strip before validation runs, so " alice" can't be stored as a look-alike of "alice".
    public UpdateProfileRequest {
        username = username == null ? null : username.strip();
    }
}
