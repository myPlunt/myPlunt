package com.myplunt.admin;

import com.myplunt.admin.dto.AdminAuthResponse;

import java.time.Instant;

// What a login or refresh hands the controller: the response body, plus the refresh token for the cookie.
public record AdminSession(AdminAuthResponse body, String refreshToken, Instant refreshTokenExpiresAt) {
}
