package com.myplunt.user.dto;

import java.util.UUID;

// avatarUrl is a short-lived link to the profile picture, null when there is none.
public record UserResponse(UUID id, String username, String email, String bio, String avatarUrl) {
}
