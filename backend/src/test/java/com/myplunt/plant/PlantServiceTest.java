package com.myplunt.plant;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.entry;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlantServiceTest {

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private WateringLogRepository wateringLogRepository;

    private final UUID userId = UUID.randomUUID();
    private final UUID plantId = UUID.randomUUID();

    private PlantService plantService() {
        return new PlantService(plantRepository, wateringLogRepository);
    }

    @Test
    void getLivingPlants_returnsTheOwnersLivingPlants() {
        Plant george = new Plant(userId, "George");
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(userId)).thenReturn(List.of(george));

        assertThat(plantService().getLivingPlants(userId)).containsExactly(george);
    }

    @Test
    void getLastWateredAt_mapsEachWateredPlantToItsLastWatering() {
        UUID neverWatered = UUID.randomUUID();
        Instant wateredAt = Instant.parse("2026-10-07T08:00:00Z");
        when(wateringLogRepository.findLastWateredAt(List.of(plantId, neverWatered)))
                .thenReturn(List.of(new LastWatering(plantId, wateredAt)));

        assertThat(plantService().getLastWateredAt(List.of(plantId, neverWatered)))
                .containsExactly(entry(plantId, wateredAt));
    }

    @Test
    void getLastWateredAt_skipsTheQueryWithoutPlants() {
        assertThat(plantService().getLastWateredAt(List.of())).isEmpty();
        verify(wateringLogRepository, never()).findLastWateredAt(any());
    }

    @Test
    void water_logsAWateringByTheUserNow() {
        Plant george = new Plant(userId, "George");
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(george));
        Instant before = Instant.now();

        plantService().water(userId, plantId);

        ArgumentCaptor<WateringLog> saved = ArgumentCaptor.forClass(WateringLog.class);
        verify(wateringLogRepository).save(saved.capture());
        assertThat(saved.getValue().getPlant()).isSameAs(george);
        assertThat(saved.getValue().getWateredBy()).isEqualTo(userId);
        assertThat(saved.getValue().getWateredAt()).isBetween(before, Instant.now());
    }

    @Test
    void water_throwsNotFoundForAPlantTheUserDoesNotOwn() {
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> plantService().water(userId, plantId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Plant not found");
        verify(wateringLogRepository, never()).save(any());
    }

    @Test
    void water_rejectsAPlantThatHasDied() {
        Plant george = new Plant(userId, "George");
        george.setAlive(false);
        when(plantRepository.findByIdAndOwnerId(plantId, userId)).thenReturn(Optional.of(george));

        assertThatThrownBy(() -> plantService().water(userId, plantId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode")
                .isEqualTo(HttpStatus.CONFLICT);
        verify(wateringLogRepository, never()).save(any());
    }
}
