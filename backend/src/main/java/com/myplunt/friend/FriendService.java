package com.myplunt.friend;

import com.myplunt.common.exception.NotFoundException;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.friend.dto.FriendRequestsResponse;
import com.myplunt.friend.dto.SitterResponse;
import com.myplunt.garden.GardenService;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.PlantService;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantPhotoResponse;
import com.myplunt.post.PostService;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.species.SpeciesService;
import com.myplunt.species.dto.DiscoveredSpeciesResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserService;
import com.myplunt.user.dto.UserSummaryResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class FriendService {

    private final FriendshipRepository friendshipRepository;
    private final UserService userService;
    private final GardenService gardenService;
    private final PlantService plantService;
    private final SpeciesService speciesService;
    private final PostService postService;
    private final PushNotificationService pushNotificationService;
    private final AuditLog auditLog;

    public FriendService(
            FriendshipRepository friendshipRepository,
            UserService userService,
            GardenService gardenService,
            PlantService plantService,
            SpeciesService speciesService,
            PostService postService,
            PushNotificationService pushNotificationService,
            AuditLog auditLog) {
        this.friendshipRepository = friendshipRepository;
        this.userService = userService;
        this.gardenService = gardenService;
        this.plantService = plantService;
        this.speciesService = speciesService;
        this.postService = postService;
        this.pushNotificationService = pushNotificationService;
        this.auditLog = auditLog;
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> search(UUID searcherId, String query) {
        List<User> users = userService.searchUsers(searcherId, query);
        if (users.isEmpty()) {
            return List.of();
        }
        Map<UUID, Friendship> friendships = friendshipRepository
                .findBetween(searcherId, users.stream().map(User::getId).toList())
                .stream()
                .collect(Collectors.toMap(
                        f -> f.getRequesterId().equals(searcherId) ? f.getReceiverId() : f.getRequesterId(),
                        Function.identity()));
        return users.stream()
                .map(user -> userService.toSummary(user, friendship(friendships.get(user.getId()), searcherId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public UserSummaryResponse getSummary(UUID viewerId, UUID userId) {
        User user = userService.loadUser(userId);
        List<Friendship> friendship = friendshipRepository.findBetween(viewerId, List.of(userId));
        return userService.toSummary(user, friendship(friendship.isEmpty() ? null : friendship.getFirst(), viewerId));
    }

    // Declining deletes the row, so only "blocked" (not used yet) would read as a pending request here.
    private static String friendship(Friendship friendship, UUID viewerId) {
        if (friendship == null) {
            return null;
        }
        if (Friendship.ACCEPTED.equals(friendship.getStatus())) {
            return "friends";
        }
        return friendship.getRequesterId().equals(viewerId) ? "request_sent" : "request_received";
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getFriends(UUID userId) {
        return summaries(friendshipRepository.findFriends(userId), "friends");
    }

    // Same city first, then closest; friends without a location last.
    @Transactional(readOnly = true)
    public List<SitterResponse> getSitters(UUID userId) {
        User me = userService.loadUser(userId);
        return friendshipRepository.findFriends(userId).stream()
                .map(friend -> new SitterResponse(
                        userService.toSummary(friend, "friends"),
                        friend.getCity(),
                        distanceKm(me, friend),
                        me.getCity() != null && me.getCity().equalsIgnoreCase(friend.getCity())))
                .sorted(Comparator.comparing(SitterResponse::sameCity).reversed()
                        .thenComparing(SitterResponse::distanceKm, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();
    }

    // Haversine, rounded to 0.1 km.
    private static Double distanceKm(User a, User b) {
        if (a.getLatitude() == null || a.getLongitude() == null || b.getLatitude() == null || b.getLongitude() == null) {
            return null;
        }
        double dLat = Math.toRadians(b.getLatitude() - a.getLatitude());
        double dLon = Math.toRadians(b.getLongitude() - a.getLongitude());
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(a.getLatitude())) * Math.cos(Math.toRadians(b.getLatitude())) * Math.pow(Math.sin(dLon / 2), 2);
        return Math.round(2 * 6371 * Math.asin(Math.sqrt(h)) * 10) / 10.0;
    }

    @Transactional(readOnly = true)
    public FriendRequestsResponse getRequests(UUID userId) {
        return new FriendRequestsResponse(
                summaries(friendshipRepository.findRequesters(userId), "request_received"),
                summaries(friendshipRepository.findRequested(userId), "request_sent"));
    }

    @Transactional
    public void accept(UUID userId, UUID requesterId) {
        pendingRequest(requesterId, userId).accept();
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_ACCEPTED, userId, userId, Map.of("other_user_id", requesterId));
    }

    // Deleted rather than marked declined: the pair index would otherwise stop either of them asking again.
    @Transactional
    public void decline(UUID userId, UUID requesterId) {
        friendshipRepository.delete(pendingRequest(requesterId, userId));
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_DECLINED, userId, userId, Map.of("other_user_id", requesterId));
    }

    @Transactional
    public void cancel(UUID userId, UUID receiverId) {
        friendshipRepository.delete(pendingRequest(userId, receiverId));
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_CANCELLED, userId, userId, Map.of("other_user_id", receiverId));
    }

    @Transactional
    public void remove(UUID userId, UUID friendId) {
        friendshipRepository.delete(acceptedFriendship(userId, friendId));
        auditLog.recorded(AuditEvent.FRIEND_REMOVED, userId, userId, Map.of("other_user_id", friendId));
    }

    @Transactional(readOnly = true)
    public GardenResponse getFriendGarden(UUID userId, UUID friendId, ZoneId zone) {
        requireFriends(userId, friendId);
        return gardenService.getGarden(friendId, zone);
    }

    // Looked up as the friend's own plant, so a plant id from someone else's garden is a 404.
    @Transactional(readOnly = true)
    public PlantDetailsResponse getFriendPlant(UUID userId, UUID friendId, UUID plantId) {
        requireFriends(userId, friendId);
        return plantService.getDetails(friendId, plantId);
    }

    @Transactional(readOnly = true)
    public List<PlantPhotoResponse> getFriendPlantPhotos(UUID userId, UUID friendId, UUID plantId) {
        requireFriends(userId, friendId);
        return plantService.getPhotos(friendId, plantId);
    }

    @Transactional(readOnly = true)
    public List<DiscoveredSpeciesResponse> getFriendDiscoveredSpecies(UUID userId, UUID friendId) {
        requireFriends(userId, friendId);
        return speciesService.getDiscoveredSpecies(friendId);
    }

    @Transactional(readOnly = true)
    public List<PostResponse> getFriendPosts(UUID userId, UUID friendId) {
        requireFriends(userId, friendId);
        return postService.getUserPosts(userId, friendId);
    }

    @Transactional(readOnly = true)
    public boolean areFriends(UUID userId, UUID otherId) {
        return findAcceptedFriendship(userId, otherId).isPresent();
    }

    // Strangers and pending requests get the same 404 as an unknown user, so it doesn't tell them who exists.
    private void requireFriends(UUID userId, UUID otherId) {
        acceptedFriendship(userId, otherId);
    }

    private Friendship acceptedFriendship(UUID userId, UUID otherId) {
        return findAcceptedFriendship(userId, otherId)
                .orElseThrow(() -> new NotFoundException("You're not friends with this user"));
    }

    private Optional<Friendship> findAcceptedFriendship(UUID userId, UUID otherId) {
        return friendshipRepository.findBetween(userId, List.of(otherId)).stream()
                .filter(f -> Friendship.ACCEPTED.equals(f.getStatus()))
                .findFirst();
    }

    // Looked up by direction, so accept/decline can't touch the user's own request and cancel can't touch one they received.
    private Friendship pendingRequest(UUID requesterId, UUID receiverId) {
        return friendshipRepository
                .findByRequesterIdAndReceiverIdAndStatus(requesterId, receiverId, Friendship.PENDING)
                .orElseThrow(() -> new NotFoundException("No pending friend request with this user"));
    }

    private List<UserSummaryResponse> summaries(List<User> users, String friendship) {
        return users.stream().map(user -> userService.toSummary(user, friendship)).toList();
    }

    @Transactional
    public void sendRequest(UUID requesterId, UUID receiverId) {
        if (requesterId.equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't add yourself as a friend");
        }
        User receiver = userService.loadUser(receiverId);

        List<Friendship> existing = friendshipRepository.findBetween(requesterId, List.of(receiverId));
        if (!existing.isEmpty()) {
            Friendship friendship = existing.getFirst();
            String message = Friendship.ACCEPTED.equals(friendship.getStatus()) ? "You're already friends"
                    : friendship.getRequesterId().equals(requesterId) ? "Request already sent"
                    : receiver.getUsername() + " already sent you a request";
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }

        try {
            friendshipRepository.saveAndFlush(new Friendship(requesterId, receiverId));
        } catch (DataIntegrityViolationException e) {
            // Both sent a request at the same moment; the unique pair index let only one in.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request already sent");
        }
        auditLog.recorded(AuditEvent.FRIEND_REQUEST_SENT, requesterId, requesterId, Map.of("other_user_id", receiverId));
        pushNotificationService.sendFriendRequest(requesterId, receiverId);
    }
}
