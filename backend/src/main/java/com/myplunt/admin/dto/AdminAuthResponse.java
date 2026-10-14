package com.myplunt.admin.dto;

// The refresh token isn't in here: it only travels in an httpOnly cookie (AdminRefreshCookie).
public record AdminAuthResponse(String accessToken, AdminResponse admin) {
}
