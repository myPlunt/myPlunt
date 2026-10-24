package com.myplunt.care;

import com.myplunt.care.dto.CareRequestResponse;
import com.myplunt.care.dto.CareRequestsResponse;
import com.myplunt.care.dto.SendCareRequest;
import com.myplunt.friend.Friendship;
import com.myplunt.friend.FriendshipRepository;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.user.UserService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class CareRequestService {

    private static final List<String> LIVE = List.of(CareDelegation.PENDING, CareDelegation.ACTIVE);

    private final CareDelegationRepository careDelegationRepository;
    private final FriendshipRepository friendshipRepository;
    private final PlantRepository plantRepository;
    private final UserService userService;
    private final PushNotificationService pushNotificationService;

    public CareRequestService(
            CareDelegationRepository careDelegationRepository,
            FriendshipRepository friendshipRepository,
            PlantRepository plantRepository,
            UserService userService,
            PushNotificationService pushNotificationService) {
        this.careDelegationRepository = careDelegationRepository;
        this.friendshipRepository = friendshipRepository;
        this.plantRepository = plantRepository;
        this.userService = userService;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional
    public void send(UUID userId, SendCareRequest request) {
        UUID sitterId = request.sitterId();
        if (userId.equals(sitterId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can't ask yourself to look after your plants");
        }
        if (!request.until().isAfter(request.from())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The end date must be after the start date");
        }
        Instant now = Instant.now();
        if (!request.until().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick dates that aren't in the past");
        }
        boolean friends = friendshipRepository.findBetween(userId, List.of(sitterId)).stream()
                .anyMatch(f -> Friendship.ACCEPTED.equals(f.getStatus()));
        if (!friends) {
            throw new IllegalStateException("You're not friends with this user");
        }

        List<CareDelegation> live = careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(userId, sitterId, LIVE);
        List<CareDelegation> over = live.stream().filter(d -> !d.getActiveUntil().isAfter(now)).toList();
        over.forEach(d -> d.setStatus(CareDelegation.ENDED));
        careDelegationRepository.saveAllAndFlush(over);
        if (live.size() > over.size()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already asked this friend");
        }

        List<Plant> plants = plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(userId);
        if (plants.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add a plant before asking for a plant sitter");
        }
        try {
            careDelegationRepository.saveAllAndFlush(plants.stream()
                    .map(plant -> new CareDelegation(plant.getId(), userId, sitterId, request.from(), request.until()))
                    .toList());
        } catch (DataIntegrityViolationException e) {
            // Sent twice at the same moment; the live-request index let only one in.
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already asked this friend");
        }
        pushNotificationService.sendCareRequest(userId, sitterId, days(request.from(), request.until()));
    }

    @Transactional(readOnly = true)
    public CareRequestsResponse getRequests(UUID userId) {
        return new CareRequestsResponse(
                requests(careDelegationRepository.findByDelegatedToAndStatusInOrderByActiveFromAsc(userId, LIVE),
                        CareDelegation::getDelegatedBy),
                requests(careDelegationRepository.findByDelegatedByAndStatusInOrderByActiveFromAsc(userId, LIVE),
                        CareDelegation::getDelegatedTo));
    }

    @Transactional
    public void accept(UUID userId, UUID requesterId) {
        pendingRequest(requesterId, userId).forEach(d -> d.setStatus(CareDelegation.ACTIVE));
        pushNotificationService.sendCareAnswer(userId, requesterId, true);
    }

    @Transactional
    public void decline(UUID userId, UUID requesterId) {
        pendingRequest(requesterId, userId).forEach(d -> d.setStatus(CareDelegation.DECLINED));
        pushNotificationService.sendCareAnswer(userId, requesterId, false);
    }

    private List<CareDelegation> pendingRequest(UUID requesterId, UUID sitterId) {
        List<CareDelegation> rows = careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(
                requesterId, sitterId, List.of(CareDelegation.PENDING));
        if (rows.isEmpty()) {
            throw new IllegalStateException("No pending plant sitter request from this user");
        }
        return rows;
    }

    // Rows of one request share the other user; stays that are already over are left out.
    private List<CareRequestResponse> requests(List<CareDelegation> rows, Function<CareDelegation, UUID> otherUser) {
        Instant now = Instant.now();
        return rows.stream()
                .filter(d -> d.getActiveUntil().isAfter(now))
                .collect(Collectors.groupingBy(otherUser, LinkedHashMap::new, Collectors.toList()))
                .entrySet().stream()
                .map(entry -> {
                    CareDelegation first = entry.getValue().getFirst();
                    return new CareRequestResponse(
                            userService.toSummary(userService.loadUser(entry.getKey()), "friends"),
                            first.getActiveFrom(), first.getActiveUntil(), entry.getValue().size(), first.getStatus());
                })
                .toList();
    }

    // Rounded because a trip across a daylight-saving change is an hour short or long.
    static long days(Instant from, Instant until) {
        return Math.round(Duration.between(from, until).toHours() / 24.0);
    }
}
