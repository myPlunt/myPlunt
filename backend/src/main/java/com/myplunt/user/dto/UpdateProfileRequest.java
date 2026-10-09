package com.myplunt.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Username must not be blank.") String username,
        @Size(max = 255, message = "Bio must be at most 255 characters.") String bio) {
}
