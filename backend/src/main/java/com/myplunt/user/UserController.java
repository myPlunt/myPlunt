package com.myplunt.user;

import com.myplunt.constants.ApiPaths;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // JwtAuthFilter sets the authenticated User entity as the principal.
    @GetMapping(ApiPaths.Users.ME)
    public UserResponse me(@AuthenticationPrincipal User principal) {
        return userService.toResponse(principal);
    }

    @PutMapping(ApiPaths.Users.ME)
    public UserResponse updateMe(
            @AuthenticationPrincipal User principal, @Valid @RequestBody UpdateProfileRequest request) {
        return userService.updateProfile(principal.getId(), request);
    }

    @PutMapping(ApiPaths.Users.ME_EMAIL)
    public UserResponse changeEmail(
            @AuthenticationPrincipal User principal, @Valid @RequestBody ChangeEmailRequest request) {
        return userService.changeEmail(principal.getId(), request);
    }
}
