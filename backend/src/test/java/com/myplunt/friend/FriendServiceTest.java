package com.myplunt.friend;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.friend.dto.FriendRequestsResponse;
import com.myplunt.garden.GardenService;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.PlantService;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.post.PostService;
import com.myplunt.post.dto.PostResponse;
import com.myplunt.species.SpeciesService;
import com.myplunt.species.dto.DiscoveredSpeciesResponse;
import com.myplunt.user.User;
import com.myplunt.user.UserService;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FriendServiceTest {

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private UserService userService;

    @Mock
    private GardenService gardenService;

    @Mock
    private PlantService plantService;

    @Mock
    private SpeciesService speciesService;

    @Mock
    private PostService postService;

    @Mock
    private PushNotificationService pushNotificationService;

    @Mock
    private AuditLog auditLog;

    private final UUID janeId = UUID.randomUUID();
    private final UUID tomId = UUID.randomUUID();

    // Not in @BeforeEach: the self and unknown-user tests never look tom up, and strict stubs would fail them.
    private void tomExists() {
        User tom = new User("tom", "tom@example.com", "hashed");
        ReflectionTestUtils.setField(tom, "id", tomId);
        when(userService.loadUser(tomId)).thenReturn(tom);
    }

    private FriendService friendService() {
        return new FriendService(friendshipRepository, userService, gardenService, plantService, speciesService, postService, pushNotificationService, auditLog);
    }

    private void assertConflict(String message) {
        tomExists();
        assertThatThrownBy(() -> friendService().sendRequest(janeId, tomId))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getReason()).isEqualTo(message);
                });
    }

    @Test
    void sendRequest_savesAPendingRequestFromTheSender() {
        tomExists();
        friendService().sendRequest(janeId, tomId);

        ArgumentCaptor<Friendship> saved = ArgumentCaptor.forClass(Friendship.class);
        verify(friendshipRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getRequesterId()).isEqualTo(janeId);
        assertThat(saved.getValue().getReceiverId()).isEqualTo(tomId);
        assertThat(saved.getValue().getStatus()).isEqualTo(Friendship.PENDING);
        verify(pushNotificationService).sendFriendRequest(janeId, tomId);
    }

    @Test
    void sendRequest_rejectsAddingYourself() {
        assertThatThrownBy(() -> friendService().sendRequest(tomId, tomId))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void sendRequest_conflictsWhenAlreadyFriends() {
        Friendship friends = new Friendship(tomId, janeId);
        ReflectionTestUtils.setField(friends, "status", Friendship.ACCEPTED);
        when(friendshipRepository.findBetween(janeId, List.of(tomId))).thenReturn(List.of(friends));

        assertConflict("You're already friends");
        verify(friendshipRepository, never()).saveAndFlush(any());
        verifyNoInteractions(pushNotificationService);
    }

    @Test
    void sendRequest_conflictsWhenTheyAlreadyAsked() {
        when(friendshipRepository.findBetween(janeId, List.of(tomId)))
                .thenReturn(List.of(new Friendship(tomId, janeId)));

        assertConflict("tom already sent you a request");
    }

    private void tomAsked() {
        when(friendshipRepository.findByRequesterIdAndReceiverIdAndStatus(tomId, janeId, Friendship.PENDING))
                .thenReturn(Optional.of(new Friendship(tomId, janeId)));
    }

    @Test
    void accept_makesThemFriends() {
        Friendship request = new Friendship(tomId, janeId);
        when(friendshipRepository.findByRequesterIdAndReceiverIdAndStatus(tomId, janeId, Friendship.PENDING))
                .thenReturn(Optional.of(request));

        friendService().accept(janeId, tomId);

        assertThat(request.getStatus()).isEqualTo(Friendship.ACCEPTED);
        verify(auditLog).recorded(AuditEvent.FRIEND_REQUEST_ACCEPTED, janeId, janeId, Map.of("other_user_id", tomId));
    }

    @Test
    void decline_deletesTheRequestSoTheyCanAskAgain() {
        tomAsked();

        friendService().decline(janeId, tomId);

        ArgumentCaptor<Friendship> deleted = ArgumentCaptor.forClass(Friendship.class);
        verify(friendshipRepository).delete(deleted.capture());
        assertThat(deleted.getValue().getRequesterId()).isEqualTo(tomId);
        verify(auditLog).recorded(AuditEvent.FRIEND_REQUEST_DECLINED, janeId, janeId, Map.of("other_user_id", tomId));
    }

    // Covers a request the user sent themselves too: it's looked up with tom as the receiver, so it isn't found.
    @Test
    void acceptAndDecline_failWithoutAPendingRequestFromThem() {
        assertThatThrownBy(() -> friendService().accept(janeId, tomId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("No pending friend request with this user");
        assertThatThrownBy(() -> friendService().decline(janeId, tomId)).isInstanceOf(IllegalStateException.class);
        verify(friendshipRepository, never()).delete(any());
    }

    @Test
    void cancel_deletesTheRequestTheUserSent() {
        Friendship request = new Friendship(janeId, tomId);
        when(friendshipRepository.findByRequesterIdAndReceiverIdAndStatus(janeId, tomId, Friendship.PENDING))
                .thenReturn(Optional.of(request));

        friendService().cancel(janeId, tomId);

        verify(friendshipRepository).delete(request);
        verify(auditLog).recorded(AuditEvent.FRIEND_REQUEST_CANCELLED, janeId, janeId, Map.of("other_user_id", tomId));
    }

    // A request tom sent jane is looked up with jane as the requester, so she can't cancel it, only decline.
    @Test
    void cancel_failsWithoutAPendingRequestToThem() {
        assertThatThrownBy(() -> friendService().cancel(janeId, tomId)).isInstanceOf(IllegalStateException.class);
        verify(friendshipRepository, never()).delete(any());
    }

    // tom asked and jane accepted, so this also covers removing someone whose request you answered.
    @Test
    void remove_deletesTheFriendshipWhoeverAsked() {
        Friendship friends = new Friendship(tomId, janeId);
        friends.accept();
        when(friendshipRepository.findBetween(janeId, List.of(tomId))).thenReturn(List.of(friends));

        friendService().remove(janeId, tomId);

        verify(friendshipRepository).delete(friends);
        verify(auditLog).recorded(AuditEvent.FRIEND_REMOVED, janeId, janeId, Map.of("other_user_id", tomId));
    }

    @Test
    void remove_failsWhenTheyAreNotFriends() {
        when(friendshipRepository.findBetween(janeId, List.of(tomId))).thenReturn(List.of(new Friendship(janeId, tomId)));

        assertThatThrownBy(() -> friendService().remove(janeId, tomId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("You're not friends with this user");
        verify(friendshipRepository, never()).delete(any());
    }

    // Tom sent the request here, so it also checks the friendship counts whoever asked.
    @Test
    void getFriendGardenSpeciesAndPosts_returnAFriendsData() {
        Friendship friends = new Friendship(tomId, janeId);
        friends.accept();
        when(friendshipRepository.findBetween(janeId, List.of(tomId))).thenReturn(List.of(friends));
        GardenResponse garden = new GardenResponse(List.of());
        when(gardenService.getGarden(tomId, ZoneId.of("Europe/Amsterdam"))).thenReturn(garden);
        List<DiscoveredSpeciesResponse> discovered =
                List.of(new DiscoveredSpeciesResponse(UUID.randomUUID(), Instant.parse("2026-10-01T10:00:00Z")));
        when(speciesService.getDiscoveredSpecies(tomId)).thenReturn(discovered);
        List<PostResponse> posts = List.of(new PostResponse(
                UUID.randomUUID(), "question", null, null, null, "Why are the leaves yellow?", null, 0, Instant.now()));
        when(postService.getUserPosts(janeId, tomId)).thenReturn(posts);
        UUID plantId = UUID.randomUUID();
        PlantDetailsResponse plant = new PlantDetailsResponse(
                plantId, "Vera", null, null, null, null, null, null, null, 7, null, Instant.now(), null);
        when(plantService.getDetails(tomId, plantId)).thenReturn(plant);

        assertThat(friendService().getFriendGarden(janeId, tomId, ZoneId.of("Europe/Amsterdam"))).isEqualTo(garden);
        assertThat(friendService().getFriendPlant(janeId, tomId, plantId)).isEqualTo(plant);
        assertThat(friendService().getFriendDiscoveredSpecies(janeId, tomId)).isEqualTo(discovered);
        assertThat(friendService().getFriendPosts(janeId, tomId)).isEqualTo(posts);
    }

    // A request either way isn't a friendship yet, so their garden stays private until it's accepted.
    @Test
    void getFriendGardenSpeciesAndPosts_failForStrangersAndPendingRequests() {
        List<List<Friendship>> notFriends =
                List.of(List.of(), List.of(new Friendship(janeId, tomId)), List.of(new Friendship(tomId, janeId)));

        for (List<Friendship> between : notFriends) {
            when(friendshipRepository.findBetween(janeId, List.of(tomId))).thenReturn(between);
            assertThatThrownBy(() -> friendService().getFriendGarden(janeId, tomId, ZoneId.of("UTC")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You're not friends with this user");
            assertThatThrownBy(() -> friendService().getFriendDiscoveredSpecies(janeId, tomId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You're not friends with this user");
            assertThatThrownBy(() -> friendService().getFriendPosts(janeId, tomId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You're not friends with this user");
            assertThatThrownBy(() -> friendService().getFriendPlant(janeId, tomId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You're not friends with this user");
            assertThatThrownBy(() -> friendService().getFriendPlantPhotos(janeId, tomId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("You're not friends with this user");
        }
        verifyNoInteractions(gardenService, plantService, speciesService, postService);
    }

    @Test
    void getRequests_mapsReceivedAndSent() {
        User tom = new User("tom", "tom@example.com", "hashed");
        User mia = new User("mia", "mia@example.com", "hashed");
        UserSummaryResponse tomSummary = new UserSummaryResponse(tomId, "tom", null, null, "request_received");
        UserSummaryResponse miaSummary = new UserSummaryResponse(UUID.randomUUID(), "mia", null, null, "request_sent");
        when(friendshipRepository.findRequesters(janeId)).thenReturn(List.of(tom));
        when(friendshipRepository.findRequested(janeId)).thenReturn(List.of(mia));
        when(userService.toSummary(tom, "request_received")).thenReturn(tomSummary);
        when(userService.toSummary(mia, "request_sent")).thenReturn(miaSummary);

        assertThat(friendService().getRequests(janeId))
                .isEqualTo(new FriendRequestsResponse(List.of(tomSummary), List.of(miaSummary)));
    }

    @Test
    void getFriends_mapsEachAsAFriend() {
        User tom = new User("tom", "tom@example.com", "hashed");
        UserSummaryResponse tomSummary = new UserSummaryResponse(tomId, "tom", null, null, "friends");
        when(friendshipRepository.findFriends(janeId)).thenReturn(List.of(tom));
        when(userService.toSummary(tom, "friends")).thenReturn(tomSummary);

        assertThat(friendService().getFriends(janeId)).containsExactly(tomSummary);
    }
}
