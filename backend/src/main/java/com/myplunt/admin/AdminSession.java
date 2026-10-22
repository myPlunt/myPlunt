package com.myplunt.admin;

import com.myplunt.admin.dto.AdminAuthResponse;

import java.time.Instant;

public record AdminSession(AdminAuthResponse body, String refreshToken, Instant refreshTokenExpiresAt) {
}
