package com.myplunt.friend;

import com.myplunt.user.User;
import com.myplunt.friend.dto.FriendRequestsResponse;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserService;
import com.myplunt.user.dto.UserSummaryResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
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
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    private final UUID janeId = UUID.randomUUID();
    private final UUID tomId = UUID.randomUUID();

    // Not in @BeforeEach: the self and unknown-user tests never look tom up, and strict stubs would fail them.
    private void tomExists() {
        User tom = new User("tom", "tom@example.com", "hashed");
        ReflectionTestUtils.setField(tom, "id", tomId);
        when(userRepository.findById(tomId)).thenReturn(Optional.of(tom));
    }

    private FriendService friendService() {
        return new FriendService(friendshipRepository, userRepository, userService);
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
    }

    @Test
    void sendRequest_rejectsAddingYourself() {
        assertThatThrownBy(() -> friendService().sendRequest(tomId, tomId))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void sendRequest_failsForAnUnknownUser() {
        UUID ghostId = UUID.randomUUID();

        assertThatThrownBy(() -> friendService().sendRequest(janeId, ghostId))
                .isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(friendshipRepository);
    }

    @Test
    void sendRequest_conflictsWhenAlreadyFriends() {
        Friendship friends = new Friendship(tomId, janeId);
        ReflectionTestUtils.setField(friends, "status", Friendship.ACCEPTED);
        when(friendshipRepository.findBetween(janeId, List.of(tomId))).thenReturn(List.of(friends));

        assertConflict("You're already friends");
        verify(friendshipRepository, never()).saveAndFlush(any());
    }

    @Test
    void sendRequest_conflictsWhenAlreadySent() {
        when(friendshipRepository.findBetween(janeId, List.of(tomId)))
                .thenReturn(List.of(new Friendship(janeId, tomId)));

        assertConflict("Request already sent");
    }

    @Test
    void sendRequest_conflictsWhenTheyAlreadyAsked() {
        when(friendshipRepository.findBetween(janeId, List.of(tomId)))
                .thenReturn(List.of(new Friendship(tomId, janeId)));

        assertConflict("tom already sent you a request");
    }

    @Test
    void sendRequest_conflictsWhenTheyAskedAtTheSameMoment() {
        when(friendshipRepository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("uq"));

        assertConflict("Request already sent");
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
    }

    @Test
    void decline_deletesTheRequestSoTheyCanAskAgain() {
        tomAsked();

        friendService().decline(janeId, tomId);

        ArgumentCaptor<Friendship> deleted = ArgumentCaptor.forClass(Friendship.class);
        verify(friendshipRepository).delete(deleted.capture());
        assertThat(deleted.getValue().getRequesterId()).isEqualTo(tomId);
    }

    // Covers a request the user sent themselves too: it's looked up with tom as the receiver, so it isn't found.
    @Test
    void acceptAndDecline_failWithoutAPendingRequestFromThem() {
        assertThatThrownBy(() -> friendService().accept(janeId, tomId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("No friend request from this user");
        assertThatThrownBy(() -> friendService().decline(janeId, tomId)).isInstanceOf(IllegalStateException.class);
        verify(friendshipRepository, never()).delete(any());
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
