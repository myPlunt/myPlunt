package com.myplunt.user;

import com.myplunt.constants.ApiPaths;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.UpdateAvatarRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import com.myplunt.user.dto.UserSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

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

    @GetMapping(ApiPaths.Users.SEARCH)
    public List<UserSummaryResponse> search(
            @AuthenticationPrincipal User principal, @RequestParam(defaultValue = "") String q) {
        return userService.search(principal.getId(), q);
    }

    // Another user's profile, with how they relate to the signed-in user.
    @GetMapping(ApiPaths.Users.BY_ID)
    public UserSummaryResponse user(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        return userService.getSummary(principal.getId(), userId);
    }

    @PutMapping(ApiPaths.Users.ME_EMAIL)
    public UserResponse changeEmail(
            @AuthenticationPrincipal User principal, @Valid @RequestBody ChangeEmailRequest request) {
        return userService.changeEmail(principal.getId(), request);
    }

    // The app uploads the photo itself (POST /v1/photos/upload-url), then sends its key here.
    @PutMapping(ApiPaths.Users.ME_AVATAR)
    public UserResponse updateAvatar(
            @AuthenticationPrincipal User principal, @Valid @RequestBody UpdateAvatarRequest request) {
        return userService.updateAvatar(principal.getId(), request);
    }

    @DeleteMapping(ApiPaths.Users.ME_AVATAR)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAvatar(@AuthenticationPrincipal User principal) {
        userService.removeAvatar(principal.getId());
    }
}
