package com.myplunt.user.dto;

import jakarta.validation.constraints.NotBlank;

// key is the storage key from POST /v1/photos/upload-url (category AVATAR), once the photo is uploaded.
public record UpdateAvatarRequest(@NotBlank(message = "Key must not be blank.") String key) {
}
