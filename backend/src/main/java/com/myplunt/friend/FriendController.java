package com.myplunt.friend;

import com.myplunt.constants.ApiPaths;
import com.myplunt.friend.dto.FriendRequestsResponse;
import com.myplunt.friend.dto.SendFriendRequest;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantPhotoResponse;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.species.dto.DiscoveredSpeciesResponse;
import com.myplunt.user.User;
import com.myplunt.user.dto.UserSummaryResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
public class FriendController {

    private final FriendService friendService;

    public FriendController(FriendService friendService) {
        this.friendService = friendService;
    }

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

    @PostMapping(ApiPaths.Friends.CANCEL)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        friendService.cancel(principal.getId(), userId);
    }

    @PostMapping(ApiPaths.Friends.REMOVE)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        friendService.remove(principal.getId(), userId);
    }

    // zone is the viewer's, not the friend's.
    @GetMapping(ApiPaths.Users.GARDEN)
    public GardenResponse garden(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID userId,
            @RequestParam(defaultValue = "UTC") ZoneId zone) {
        return friendService.getFriendGarden(principal.getId(), userId, zone);
    }

    @GetMapping(ApiPaths.Users.PLANT)
    public PlantDetailsResponse plant(
            @AuthenticationPrincipal User principal, @PathVariable UUID userId, @PathVariable UUID plantId) {
        return friendService.getFriendPlant(principal.getId(), userId, plantId);
    }

    @GetMapping(ApiPaths.Users.PLANT_PHOTOS)
    public List<PlantPhotoResponse> plantPhotos(
            @AuthenticationPrincipal User principal, @PathVariable UUID userId, @PathVariable UUID plantId) {
        return friendService.getFriendPlantPhotos(principal.getId(), userId, plantId);
    }

    @GetMapping(ApiPaths.Users.DISCOVERED_SPECIES)
    public List<DiscoveredSpeciesResponse> discoveredSpecies(
            @AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        return friendService.getFriendDiscoveredSpecies(principal.getId(), userId);
    }

    @GetMapping(ApiPaths.Users.POSTS)
    public List<PostResponse> posts(@AuthenticationPrincipal User principal, @PathVariable UUID userId) {
        return friendService.getFriendPosts(principal.getId(), userId);
    }
}
