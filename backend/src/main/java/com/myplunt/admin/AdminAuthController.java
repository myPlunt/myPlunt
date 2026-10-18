package com.myplunt.admin;

import com.myplunt.admin.dto.AdminAuthResponse;
import com.myplunt.admin.dto.AdminLoginRequest;
import com.myplunt.admin.dto.AdminResponse;
import com.myplunt.constants.ApiPaths;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminAuthController {

    private final AdminAuthService adminAuthService;
    private final AdminRefreshCookie refreshCookie;

    public AdminAuthController(AdminAuthService adminAuthService, AdminRefreshCookie refreshCookie) {
        this.adminAuthService = adminAuthService;
        this.refreshCookie = refreshCookie;
    }

    @PostMapping(ApiPaths.Admin.LOGIN)
    public AdminAuthResponse login(@Valid @RequestBody AdminLoginRequest request, HttpServletResponse response) {
        return withCookie(adminAuthService.login(request), response);
    }

    @PostMapping(ApiPaths.Admin.REFRESH)
    public AdminAuthResponse refresh(
            @CookieValue(name = AdminRefreshCookie.NAME, required = false) String refreshToken,
            HttpServletResponse response) {
        return withCookie(adminAuthService.refresh(refreshToken), response);
    }

    @PostMapping(ApiPaths.Admin.LOGOUT)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(
            @CookieValue(name = AdminRefreshCookie.NAME, required = false) String refreshToken,
            HttpServletResponse response) {
        adminAuthService.logout(refreshToken);
        refreshCookie.clear(response);
    }

    @GetMapping(ApiPaths.Admin.ME)
    public AdminResponse me(@AuthenticationPrincipal AdminUser admin) {
        return AdminAuthService.toResponse(admin);
    }

    private AdminAuthResponse withCookie(AdminSession session, HttpServletResponse response) {
        refreshCookie.write(response, session.refreshToken(), session.refreshTokenExpiresAt());
        return session.body();
    }
}
