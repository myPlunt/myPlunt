package com.myplunt.plant;

import com.myplunt.garden.PlanterRepository;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
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

    @Mock
    private PlanterRepository planterRepository;

    @Mock
    private SpeciesRepository speciesRepository;

    private final UUID userId = UUID.randomUUID();
    private final UUID plantId = UUID.randomUUID();

    private PlantService plantService() {
        return new PlantService(plantRepository, wateringLogRepository, planterRepository, speciesRepository);
    }

    // Gives the saved plant an id, as the database would.
    private void saveAssignsId() {
        when(plantRepository.save(any())).thenAnswer(invocation -> {
            Plant plant = invocation.getArgument(0);
            ReflectionTestUtils.setField(plant, "id", plantId);
            return plant;
        });
    }

    @Test
    void create_savesThePlantForTheOwnerAndReturnsIt() {
        saveAssignsId();

        PlantResponse response = plantService().create(
                userId, new CreatePlantRequest("Vera", "bright_indirect", 7, "Found at a flea market", null, null));

        assertThat(response).isEqualTo(new PlantResponse(plantId, "Vera", "bright_indirect", 7, "Found at a flea market", null, null));
        ArgumentCaptor<Plant> saved = ArgumentCaptor.forClass(Plant.class);
        verify(plantRepository).save(saved.capture());
        assertThat(saved.getValue().getOwnerId()).isEqualTo(userId);
        assertThat(saved.getValue().isAlive()).isTrue();
    }

    @Test
    void create_putsThePlantInTheOwnersPlanter() {
        UUID planterId = UUID.randomUUID();
        when(planterRepository.existsByIdAndOwnerId(planterId, userId)).thenReturn(true);
        saveAssignsId();

        PlantResponse response = plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, planterId, null));

        assertThat(response.planterId()).isEqualTo(planterId);
    }

    @Test
    void create_throwsNotFoundForAPlanterTheUserDoesNotOwn() {
        UUID planterId = UUID.randomUUID();
        when(planterRepository.existsByIdAndOwnerId(planterId, userId)).thenReturn(false);

        assertThatThrownBy(() -> plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, planterId, null)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Planter not found");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void create_linksTheChosenApprovedSpecies() {
        UUID speciesId = UUID.randomUUID();
        Species monstera = new Species("Monstera", 7);
        ReflectionTestUtils.setField(monstera, "id", speciesId);
        when(speciesRepository.findByIdAndApprovedTrue(speciesId)).thenReturn(Optional.of(monstera));
        saveAssignsId();

        PlantResponse response =
                plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, speciesId));

        assertThat(response.speciesId()).isEqualTo(speciesId);
        ArgumentCaptor<Plant> saved = ArgumentCaptor.forClass(Plant.class);
        verify(plantRepository).save(saved.capture());
        assertThat(saved.getValue().getSpecies()).isSameAs(monstera);
    }

    @Test
    void create_throwsNotFoundForAnUnknownOrUnapprovedSpecies() {
        UUID speciesId = UUID.randomUUID();
        when(speciesRepository.findByIdAndApprovedTrue(speciesId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                        plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, speciesId)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("Species not found");
        verify(plantRepository, never()).save(any());
    }

    @Test
    void create_keepsOptionalFieldsEmptyWhenLeftOut() {
        saveAssignsId();

        PlantResponse response = plantService().create(userId, new CreatePlantRequest("Vera", null, null, null, null, null));

        assertThat(response).isEqualTo(new PlantResponse(plantId, "Vera", null, null, null, null, null));
    }

    @Test
    void create_trimsNotesAndStoresBlankNotesAsNull() {
        saveAssignsId();

        assertThat(plantService().create(userId, new CreatePlantRequest("Vera", null, null, "  Repotted  ", null, null)).notes())
                .isEqualTo("Repotted");
        assertThat(plantService().create(userId, new CreatePlantRequest("Vera", null, null, "   ", null, null)).notes())
                .isNull();
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
