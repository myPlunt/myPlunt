package com.myplunt.admin;

import com.myplunt.constants.ApiPaths;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

// The admin refresh token lives only in this cookie. HttpOnly: the dashboard's JavaScript can't
// read it, so an XSS can't steal it. SameSite=Strict: other sites can't make the browser send it
// (no CSRF on refresh/logout). Path: it's only sent to the admin auth endpoints.
// Secure is off only in dev, where the dashboard runs on plain http://localhost.
@Component
public class AdminRefreshCookie {

    public static final String NAME = "myplunt_admin_refresh";

    private final boolean secure;

    public AdminRefreshCookie(@Value("${app.admin.cookie-secure}") boolean secure) {
        this.secure = secure;
    }

    public void write(HttpServletResponse response, String token, Instant expiresAt) {
        set(response, token, Duration.between(Instant.now(), expiresAt));
    }

    public void clear(HttpServletResponse response) {
        set(response, "", Duration.ZERO);
    }

    private void set(HttpServletResponse response, String value, Duration maxAge) {
        ResponseCookie cookie = ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path(ApiPaths.Admin.AUTH)
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
