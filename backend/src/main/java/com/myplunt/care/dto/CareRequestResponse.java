package com.myplunt.care.dto;

import com.myplunt.user.dto.UserSummaryResponse;

import java.time.Instant;

public record CareRequestResponse(UserSummaryResponse user, Instant from, Instant until, int plantCount, String status) {
}
