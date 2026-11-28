package com.myplunt.care;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CareDelegationServiceTest {

    @Mock
    private CareDelegationRepository careDelegationRepository;

    @Test
    void sittingFor_listsEachOwnerOnceAndSkipsStaysThatAreOver() {
        UUID sitterId = UUID.randomUUID();
        UUID rafaelId = UUID.randomUUID();
        UUID saraId = UUID.randomUUID();
        Instant now = Instant.parse("2026-10-25T09:00:00Z");
        Instant later = now.plus(Duration.ofDays(3));
        when(careDelegationRepository.findByDelegatedToAndStatusInOrderByActiveFromAsc(sitterId, List.of(CareDelegation.ACTIVE)))
                .thenReturn(List.of(
                        new CareDelegation(UUID.randomUUID(), rafaelId, sitterId, now.minus(Duration.ofDays(1)), later),
                        new CareDelegation(UUID.randomUUID(), rafaelId, sitterId, now.minus(Duration.ofDays(1)), later),
                        new CareDelegation(UUID.randomUUID(), saraId, sitterId, now.minus(Duration.ofDays(5)), now)));

        assertThat(new CareDelegationService(careDelegationRepository).sittingFor(sitterId, now)).containsExactly(rafaelId);
    }

    @Test
    void endBetween_endsPendingAndActiveStaysInBothDirections() {
        UUID janeId = UUID.randomUUID();
        UUID tomId = UUID.randomUUID();
        Instant now = Instant.now();
        CareDelegation janeAskedTom = new CareDelegation(UUID.randomUUID(), janeId, tomId, now, now.plus(Duration.ofDays(3)));
        janeAskedTom.setStatus(CareDelegation.ACTIVE);
        CareDelegation tomAskedJane = new CareDelegation(UUID.randomUUID(), tomId, janeId, now, now.plus(Duration.ofDays(3)));
        List<String> live = List.of(CareDelegation.PENDING, CareDelegation.ACTIVE);
        when(careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(janeId, tomId, live)).thenReturn(List.of(janeAskedTom));
        when(careDelegationRepository.findByDelegatedByAndDelegatedToAndStatusIn(tomId, janeId, live)).thenReturn(List.of(tomAskedJane));

        new CareDelegationService(careDelegationRepository).endBetween(janeId, tomId);

        assertThat(janeAskedTom.getStatus()).isEqualTo(CareDelegation.ENDED);
        assertThat(tomAskedJane.getStatus()).isEqualTo(CareDelegation.ENDED);
    }
}
