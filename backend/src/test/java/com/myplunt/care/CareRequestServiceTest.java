package com.myplunt.care;

import com.myplunt.care.dto.SendCareRequest;
import com.myplunt.friend.Friendship;
import com.myplunt.friend.FriendshipRepository;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.user.User;
import com.myplunt.user.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CareRequestServiceTest {

    @Mock
    private CareDelegationRepository careDelegationRepository;

    @Mock
    private FriendshipRepository friendshipRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private UserService userService;

    @Mock
    private PushNotificationService pushNotificationService;

    private final UUID rafaelId = UUID.randomUUID();
    private final UUID saraId = UUID.randomUUID();
    private final Instant from = Instant.now().plus(Duration.ofDays(1));
    private final Instant until = from.plus(Duration.ofDays(9));

    private CareRequestService service() {
        return new CareRequestService(careDelegationRepository, friendshipRepository, plantRepository, userService, pushNotificationService);
    }

    private void friends() {
        Friendship friendship = new Friendship(rafaelId, saraId);
        friendship.accept();
        when(friendshipRepository.findBetween(rafaelId, List.of(saraId))).thenReturn(List.of(friendship));
    }

    private Plant plant(String name) {
        Plant plant = new Plant(rafaelId, name);
        ReflectionTestUtils.setField(plant, "id", UUID.randomUUID());
        return plant;
    }

    @Test
    @SuppressWarnings("unchecked")
    void send_savesAPendingRowPerPlantAndTellsTheSitterHowLong() {
        friends();
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(rafaelId))
                .thenReturn(List.of(plant("Monstera"), plant("Fern")));

        service().send(rafaelId, new SendCareRequest(saraId, from, until));

        ArgumentCaptor<List<CareDelegation>> saved = ArgumentCaptor.forClass(List.class);
        // First call closes past stays (none here), the second saves the request.
        verify(careDelegationRepository, times(2)).saveAllAndFlush(saved.capture());
        assertThat(saved.getAllValues().getLast())
                .hasSize(2)
                .allSatisfy(row -> {
                    assertThat(row.getDelegatedBy()).isEqualTo(rafaelId);
                    assertThat(row.getDelegatedTo()).isEqualTo(saraId);
                    assertThat(row.getStatus()).isEqualTo(CareDelegation.PENDING);
                    assertThat(row.getActiveUntil()).isEqualTo(until);
                });
        verify(pushNotificationService).sendCareRequest(rafaelId, saraId, 9);
    }

    @Test
    void send_conflictsWhileARequestToAnotherFriendIsStillLive() {
        friends();
        UUID tomId = UUID.randomUUID();
        User tom = new User("tom", "tom@example.com", "hashed");
        when(userService.loadUser(tomId)).thenReturn(tom);
        when(careDelegationRepository.findByDelegatedByAndStatusInOrderByActiveFromAsc(any(), any()))
                .thenReturn(List.of(new CareDelegation(UUID.randomUUID(), rafaelId, tomId, from, until)));

        assertThatThrownBy(() -> service().send(rafaelId, new SendCareRequest(saraId, from, until)))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getReason()).isEqualTo("You already asked tom. Cancel that request first");
                });
        verify(careDelegationRepository, never()).saveAllAndFlush(argThat((List<CareDelegation> rows) -> !rows.isEmpty()));
        verifyNoInteractions(pushNotificationService);
    }

    @Test
    void send_rejectsSomeoneWhoIsNotAFriend() {
        when(friendshipRepository.findBetween(rafaelId, List.of(saraId))).thenReturn(List.of());

        assertThatThrownBy(() -> service().send(rafaelId, new SendCareRequest(saraId, from, until)))
                .isInstanceOf(IllegalStateException.class);
        verify(careDelegationRepository, never()).saveAllAndFlush(anyList());
    }

    @Test
    void accept_startsTheStayAndTellsWhoAsked() {
        CareDelegation row = new CareDelegation(UUID.randomUUID(), rafaelId, saraId, from, until);
        when(careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(rafaelId, saraId, List.of(CareDelegation.PENDING)))
                .thenReturn(List.of(row));

        service().accept(saraId, rafaelId);

        assertThat(row.getStatus()).isEqualTo(CareDelegation.ACTIVE);
        verify(pushNotificationService).sendCareAnswer(saraId, rafaelId, true);
    }

    @Test
    void cancel_endsAnAcceptedStayAndTellsTheSitter() {
        CareDelegation row = new CareDelegation(UUID.randomUUID(), rafaelId, saraId, from, until);
        row.setStatus(CareDelegation.ACTIVE);
        when(careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(
                rafaelId, saraId, List.of(CareDelegation.PENDING, CareDelegation.ACTIVE)))
                .thenReturn(List.of(row));

        service().cancel(rafaelId, saraId);

        assertThat(row.getStatus()).isEqualTo(CareDelegation.ENDED);
        verify(pushNotificationService).sendCareCancelled(rafaelId, saraId);
    }

    @Test
    void decline_endsAnAcceptedStayAndTellsWhoAsked() {
        CareDelegation row = new CareDelegation(UUID.randomUUID(), rafaelId, saraId, from, until);
        row.setStatus(CareDelegation.ACTIVE);
        when(careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(
                rafaelId, saraId, List.of(CareDelegation.PENDING, CareDelegation.ACTIVE)))
                .thenReturn(List.of(row));

        service().decline(saraId, rafaelId);

        assertThat(row.getStatus()).isEqualTo(CareDelegation.ENDED);
        verify(pushNotificationService).sendCareWithdrawn(saraId, rafaelId);
    }

    @Test
    void decline_throwsWhenThereIsNoRequest() {
        when(careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(any(), any(), any()))
                .thenReturn(List.of());

        assertThatThrownBy(() -> service().decline(saraId, rafaelId)).isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(pushNotificationService);
    }
}
