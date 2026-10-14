package com.myplunt.friend;

import com.myplunt.constants.ApiPaths;
import com.myplunt.friend.dto.FriendRequestsResponse;
import com.myplunt.friend.dto.SendFriendRequest;
import com.myplunt.user.User;
import com.myplunt.user.dto.UserSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

    // The signed-in user asks userId to be friends; it stays pending until they answer.
    @PostMapping(ApiPaths.Friends.REQUESTS)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendRequest(@AuthenticationPrincipal User principal, @Valid @RequestBody SendFriendRequest request) {
        friendService.sendRequest(principal.getId(), request.userId());
    }

    @GetMapping(ApiPaths.Friends.BASE)
    public List<UserSummaryResponse> friends(@AuthenticationPrincipal User principal) {
        return friendService.getFriends(principal.getId());
    }

    @GetMapping(ApiPaths.Friends.REQUESTS)
    public FriendRequestsResponse requests(@AuthenticationPrincipal User principal) {
        return friendService.getRequests(principal.getId());
    }

    // userId is the person who sent the request; the signed-in user is answering it.
    @PostMapping(ApiPaths.Friends.ACCEPT)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void accept(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        friendService.accept(principal.getId(), userId);
    }

    @PostMapping(ApiPaths.Friends.DECLINE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void decline(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        friendService.decline(principal.getId(), userId);
    }

    // userId is the person the signed-in user asked; takes the request back before they answer.
    @PostMapping(ApiPaths.Friends.CANCEL)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        friendService.cancel(principal.getId(), userId);
    }
}
