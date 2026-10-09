package com.myplunt.user;

import com.myplunt.constants.ApiPaths;
import com.myplunt.user.dto.UserResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
}
