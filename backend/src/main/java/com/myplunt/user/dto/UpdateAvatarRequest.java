package com.myplunt.user.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateAvatarRequest(@NotBlank(message = "Key must not be blank.") String key) {
}
