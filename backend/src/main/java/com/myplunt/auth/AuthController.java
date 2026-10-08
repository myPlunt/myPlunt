package com.myplunt.auth;

import com.myplunt.auth.dto.AuthResponse;
import com.myplunt.auth.dto.LoginRequest;
import com.myplunt.auth.dto.LogoutRequest;
import com.myplunt.auth.dto.RefreshRequest;
import com.myplunt.auth.dto.RegisterRequest;
import com.myplunt.constants.ApiPaths;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping(ApiPaths.Auth.REGISTER)
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping(ApiPaths.Auth.LOGIN)
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping(ApiPaths.Auth.LOGOUT)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request.refreshToken());
    }

    @PostMapping(ApiPaths.Auth.REFRESH)
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }
}
