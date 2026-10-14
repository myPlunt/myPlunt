package com.myplunt.friend;

import com.myplunt.constants.ApiPaths;
import com.myplunt.friend.dto.SendFriendRequest;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

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
}
