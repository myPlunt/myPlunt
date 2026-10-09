package com.myplunt.garden;

import com.myplunt.garden.dto.GardenPlantResponse;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.garden.dto.RoomResponse;
import com.myplunt.plant.LastWatering;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.plant.WateringLogRepository;
import com.myplunt.species.Species;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GardenServiceTest {

    @Mock
    private PlanterRepository planterRepository;

    @Mock
    private PlantRepository plantRepository;

    @Mock
    private WateringLogRepository wateringLogRepository;

    private final UUID ownerId = UUID.randomUUID();
    private final Instant addedAt = Instant.parse("2026-09-01T10:00:00Z");

    private GardenService gardenService() {
        return new GardenService(planterRepository, plantRepository, wateringLogRepository);
    }

    private Planter planter(String name) {
        Planter planter = new Planter(ownerId, name);
        ReflectionTestUtils.setField(planter, "id", UUID.randomUUID());
        return planter;
    }

    private Plant plant(String name, Planter planter, Integer wateringFrequencyDays) {
        Plant plant = new Plant(ownerId, name);
        ReflectionTestUtils.setField(plant, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(plant, "createdAt", addedAt);
        plant.setPlanterId(planter == null ? null : planter.getId());
        plant.setSpecies(new Species("Basil", wateringFrequencyDays));
        return plant;
    }

    @Test
    void getGarden_groupsPlantsByRoomInRoomOrder() {
        Planter balcony = planter("Balcony");
        Planter kitchen = planter("Kitchen windowsill");
        Plant basil = plant("Basil", kitchen, 3);
        Plant george = plant("George", balcony, 4);
        Plant minty = plant("Minty", kitchen, 3);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony, kitchen));
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(basil, george, minty));
        when(wateringLogRepository.findLastWateredAt(any())).thenReturn(List.of());

        GardenResponse garden = gardenService().getGarden(ownerId);

        assertThat(garden.rooms()).extracting(RoomResponse::name).containsExactly("Balcony", "Kitchen windowsill");
        assertThat(garden.rooms().get(0).plants()).extracting(GardenPlantResponse::name).containsExactly("George");
        assertThat(garden.rooms().get(1).plants()).extracting(GardenPlantResponse::name).containsExactly("Basil", "Minty");
    }

    @Test
    void getGarden_includesEmptyRooms() {
        Planter balcony = planter("Balcony");
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId)).thenReturn(List.of());

        GardenResponse garden = gardenService().getGarden(ownerId);

        assertThat(garden.rooms()).containsExactly(new RoomResponse(balcony.getId(), "Balcony", List.of()));
        verify(wateringLogRepository, never()).findLastWateredAt(any());
    }

    @Test
    void getGarden_putsPlantsWithoutARoomInALastGroupWithoutId() {
        Planter balcony = planter("Balcony");
        Plant george = plant("George", balcony, 4);
        Plant stray = plant("Stray", null, 4);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(stray, george));
        when(wateringLogRepository.findLastWateredAt(any())).thenReturn(List.of());

        GardenResponse garden = gardenService().getGarden(ownerId);

        RoomResponse unassigned = garden.rooms().get(1);
        assertThat(unassigned.id()).isNull();
        assertThat(unassigned.name()).isEqualTo("Other plants");
        assertThat(unassigned.plants()).extracting(GardenPlantResponse::name).containsExactly("Stray");
    }

    @Test
    void getGarden_schedulesNextWateringFromTheLastWatering() {
        Planter balcony = planter("Balcony");
        Plant george = plant("George", balcony, 4);
        Instant wateredAt = Instant.parse("2026-10-07T08:00:00Z");
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(george));
        when(wateringLogRepository.findLastWateredAt(List.of(george.getId())))
                .thenReturn(List.of(new LastWatering(george.getId(), wateredAt)));

        GardenPlantResponse response = gardenService().getGarden(ownerId).rooms().get(0).plants().get(0);

        assertThat(response).isEqualTo(new GardenPlantResponse(
                george.getId(), "George", "Basil", 4, wateredAt, wateredAt.plus(Duration.ofDays(4))));
    }

    @Test
    void getGarden_schedulesANeverWateredPlantFromWhenItWasAdded() {
        Planter balcony = planter("Balcony");
        Plant george = plant("George", balcony, 4);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(george));
        when(wateringLogRepository.findLastWateredAt(any())).thenReturn(List.of());

        GardenPlantResponse response = gardenService().getGarden(ownerId).rooms().get(0).plants().get(0);

        assertThat(response.lastWateredAt()).isNull();
        assertThat(response.nextWateringAt()).isEqualTo(addedAt.plus(Duration.ofDays(4)));
    }

    @Test
    void getGarden_leavesTheScheduleEmptyWhenTheSpeciesHasNoWateringFrequency() {
        Planter balcony = planter("Balcony");
        Plant unknown = plant("Mystery", balcony, null);
        Plant noSpecies = plant("Nameless", balcony, 4);
        noSpecies.setSpecies(null);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(unknown, noSpecies));
        when(wateringLogRepository.findLastWateredAt(any())).thenReturn(List.of());

        List<GardenPlantResponse> plants = gardenService().getGarden(ownerId).rooms().get(0).plants();

        assertThat(plants).extracting(GardenPlantResponse::speciesName).containsExactly("Basil", null);
        assertThat(plants).allSatisfy(plant -> {
            assertThat(plant.wateringFrequencyDays()).isNull();
            assertThat(plant.nextWateringAt()).isNull();
        });
    }
}
