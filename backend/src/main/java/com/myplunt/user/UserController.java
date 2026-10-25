package com.myplunt.user;

import com.myplunt.constants.ApiPaths;
import com.myplunt.user.dto.ChangeEmailRequest;
import com.myplunt.user.dto.CompleteOnboardingRequest;
import com.myplunt.user.dto.NotificationSettings;
import com.myplunt.user.dto.UpdateAvatarRequest;
import com.myplunt.user.dto.UpdateLocationRequest;
import com.myplunt.user.dto.UpdateProfileRequest;
import com.myplunt.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

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

    @PutMapping(ApiPaths.Users.ME_AVATAR)
    public UserResponse updateAvatar(
            @AuthenticationPrincipal User principal, @Valid @RequestBody UpdateAvatarRequest request) {
        return userService.updateAvatar(principal.getId(), request);
    }

    @PutMapping(ApiPaths.Users.ME_LOCATION)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateLocation(
            @AuthenticationPrincipal User principal, @Valid @RequestBody UpdateLocationRequest request) {
        userService.updateLocation(principal.getId(), request);
    }

    @PutMapping(ApiPaths.Users.ME_ONBOARDING)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void completeOnboarding(
            @AuthenticationPrincipal User principal, @Valid @RequestBody CompleteOnboardingRequest request) {
        userService.completeOnboarding(principal.getId(), request);
    }

    @GetMapping(ApiPaths.Users.ME_NOTIFICATIONS)
    public NotificationSettings notificationSettings(@AuthenticationPrincipal User principal) {
        return userService.notificationSettings(principal.getId());
    }

    @PutMapping(ApiPaths.Users.ME_NOTIFICATIONS)
    public NotificationSettings updateNotificationSettings(
            @AuthenticationPrincipal User principal, @Valid @RequestBody NotificationSettings request) {
        return userService.updateNotificationSettings(principal.getId(), request);
    }

    @DeleteMapping(ApiPaths.Users.ME_AVATAR)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeAvatar(@AuthenticationPrincipal User principal) {
        userService.removeAvatar(principal.getId());
    }
}
