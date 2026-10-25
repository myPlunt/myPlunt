package com.myplunt.care;

import com.myplunt.care.dto.CareRequestResponse;
import com.myplunt.care.dto.CareRequestsResponse;
import com.myplunt.care.dto.SendCareRequest;
import com.myplunt.friend.FriendService;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantService;
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
    private final FriendService friendService;
    private final PlantService plantService;
    private final UserService userService;
    private final PushNotificationService pushNotificationService;

    public CareRequestService(
            CareDelegationRepository careDelegationRepository,
            FriendService friendService,
            PlantService plantService,
            UserService userService,
            PushNotificationService pushNotificationService) {
        this.careDelegationRepository = careDelegationRepository;
        this.friendService = friendService;
        this.plantService = plantService;
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
        if (!friendService.areFriends(userId, sitterId)) {
            throw new IllegalStateException("You're not friends with this user");
        }

        List<CareDelegation> live = careDelegationRepository.findByDelegatedByAndStatusInOrderByActiveFromAsc(userId, LIVE);
        List<CareDelegation> over = live.stream().filter(d -> !d.getActiveUntil().isAfter(now)).toList();
        over.forEach(d -> d.setStatus(CareDelegation.ENDED));
        careDelegationRepository.saveAllAndFlush(over);
        live.stream().filter(d -> d.getActiveUntil().isAfter(now)).findFirst().ifPresent(d -> {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "You already asked " + userService.loadUser(d.getDelegatedTo()).getUsername() + ". Cancel that request first");
        });

        List<Plant> plants = plantService.getLivingPlants(userId);
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

    // Also how a sitter backs out after saying yes.
    @Transactional
    public void decline(UUID userId, UUID requesterId) {
        List<CareDelegation> rows = careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(requesterId, userId, LIVE);
        if (rows.isEmpty()) {
            throw new IllegalStateException("No plant sitter request from this user");
        }
        boolean wasAccepted = CareDelegation.ACTIVE.equals(rows.getFirst().getStatus());
        rows.forEach(d -> d.setStatus(wasAccepted ? CareDelegation.ENDED : CareDelegation.DECLINED));
        if (wasAccepted) {
            pushNotificationService.sendCareWithdrawn(userId, requesterId);
        } else {
            pushNotificationService.sendCareAnswer(userId, requesterId, false);
        }
    }

    // Works while it waits for an answer and after it was accepted.
    @Transactional
    public void cancel(UUID userId, UUID sitterId) {
        List<CareDelegation> rows = careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(userId, sitterId, LIVE);
        if (rows.isEmpty()) {
            throw new IllegalStateException("No plant sitter request to this user");
        }
        rows.forEach(d -> d.setStatus(CareDelegation.ENDED));
        pushNotificationService.sendCareCancelled(userId, sitterId);
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
