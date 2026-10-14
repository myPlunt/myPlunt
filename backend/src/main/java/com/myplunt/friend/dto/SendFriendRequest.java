package com.myplunt.friend.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record SendFriendRequest(@NotNull(message = "User must not be empty.") UUID userId) {
}
