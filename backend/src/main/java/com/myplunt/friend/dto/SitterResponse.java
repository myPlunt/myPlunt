package com.myplunt.friend.dto;

import com.myplunt.user.dto.UserSummaryResponse;

// distanceKm is null when either of them hasn't set a location; coordinates themselves are never sent.
public record SitterResponse(UserSummaryResponse user, String city, Double distanceKm, boolean sameCity) {
}
