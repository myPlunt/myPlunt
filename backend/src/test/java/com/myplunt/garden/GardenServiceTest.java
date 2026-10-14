package com.myplunt.garden;

import com.myplunt.garden.dto.GardenPlantResponse;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.garden.dto.RoomResponse;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantService;
import com.myplunt.plant.WateringSchedule;
import com.myplunt.species.Species;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GardenServiceTest {

    @Mock
    private PlanterRepository planterRepository;

    @Mock
    private PlantService plantService;

    private final UUID ownerId = UUID.randomUUID();
    private final Instant addedAt = Instant.parse("2026-09-01T10:00:00Z");
    private final ZoneId zone = ZoneId.of("Europe/Amsterdam");

    private GardenService gardenService() {
        return new GardenService(planterRepository, plantService);
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
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(basil, george, minty));

        GardenResponse garden = gardenService().getGarden(ownerId, zone);

        assertThat(garden.rooms()).extracting(RoomResponse::name).containsExactly("Balcony", "Kitchen windowsill");
        assertThat(garden.rooms().get(0).plants()).extracting(GardenPlantResponse::name).containsExactly("George");
        assertThat(garden.rooms().get(1).plants()).extracting(GardenPlantResponse::name).containsExactly("Basil", "Minty");
    }

    @Test
    void getGarden_includesEmptyRooms() {
        Planter balcony = planter("Balcony");
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of());

        GardenResponse garden = gardenService().getGarden(ownerId, zone);

        assertThat(garden.rooms()).containsExactly(new RoomResponse(balcony.getId(), "Balcony", List.of()));
    }

    @Test
    void getGarden_putsPlantsWithoutARoomInALastGroupWithoutId() {
        Planter balcony = planter("Balcony");
        Plant george = plant("George", balcony, 4);
        Plant stray = plant("Stray", null, 4);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(stray, george));

        GardenResponse garden = gardenService().getGarden(ownerId, zone);

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
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(george));
        when(plantService.getLastWateredAt(List.of(george.getId()))).thenReturn(Map.of(george.getId(), wateredAt));

        GardenPlantResponse response = gardenService().getGarden(ownerId, zone).rooms().get(0).plants().get(0);

        assertThat(response).isEqualTo(new GardenPlantResponse(
                george.getId(), "George", george.getSpecies().getId(), "Basil", 4, wateredAt, wateredAt.plus(Duration.ofDays(4)), 0, null));
    }

    @Test
    void getGarden_schedulesANeverWateredPlantFromWhenItWasAdded() {
        Planter balcony = planter("Balcony");
        Plant george = plant("George", balcony, 4);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(george));

        GardenPlantResponse response = gardenService().getGarden(ownerId, zone).rooms().get(0).plants().get(0);

        assertThat(response.lastWateredAt()).isNull();
        assertThat(response.nextWateringAt()).isEqualTo(addedAt.plus(Duration.ofDays(4)));
    }

    @Test
    void getGarden_usesTheDefaultScheduleWhenNeitherTheOwnerNorTheSpeciesSetAFrequency() {
        Planter balcony = planter("Balcony");
        Plant unknown = plant("Mystery", balcony, null);
        Plant noSpecies = plant("Nameless", balcony, 4);
        noSpecies.setSpecies(null);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(unknown, noSpecies));

        List<GardenPlantResponse> plants = gardenService().getGarden(ownerId, zone).rooms().get(0).plants();

        assertThat(plants).extracting(GardenPlantResponse::speciesName).containsExactly("Basil", null);
        assertThat(plants).allSatisfy(plant -> {
            assertThat(plant.wateringFrequencyDays()).isEqualTo(WateringSchedule.DEFAULT_FREQUENCY_DAYS);
            // Never watered, so counted from the day it was added.
            assertThat(plant.nextWateringAt()).isEqualTo(addedAt.plus(Duration.ofDays(WateringSchedule.DEFAULT_FREQUENCY_DAYS)));
        });
    }

    @Test
    void getGarden_prefersThePlantsOwnWateringPeriodOverTheSpecies() {
        Plant vera = plant("Vera", null, 4);
        vera.setWateringEveryDays(10);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of());
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(vera));

        GardenPlantResponse response = gardenService().getGarden(ownerId, zone).rooms().get(0).plants().get(0);

        assertThat(response.wateringFrequencyDays()).isEqualTo(10);
        assertThat(response.nextWateringAt()).isEqualTo(addedAt.plus(Duration.ofDays(10)));
    }

    @Test
    void getGarden_schedulesAPlantWithoutSpeciesFromItsOwnWateringPeriod() {
        Plant vera = plant("Vera", null, null);
        vera.setSpecies(null);
        vera.setWateringEveryDays(7);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of());
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(vera));

        GardenPlantResponse response = gardenService().getGarden(ownerId, zone).rooms().get(0).plants().get(0);

        assertThat(response.speciesName()).isNull();
        assertThat(response.wateringFrequencyDays()).isEqualTo(7);
        assertThat(response.nextWateringAt()).isEqualTo(addedAt.plus(Duration.ofDays(7)));
    }

    @Test
    void getGarden_linksEachPlantsPhoto() {
        Planter balcony = planter("Balcony");
        Plant george = plant("George", balcony, 4);
        Plant pinky = plant("Pinky", balcony, 4);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantService.getLivingPlants(ownerId)).thenReturn(List.of(george, pinky));
        when(plantService.getPhotoUrls(List.of(george.getId(), pinky.getId())))
                .thenReturn(Map.of(george.getId(), "https://storage.test/george.jpg?signed"));

        List<GardenPlantResponse> plants = gardenService().getGarden(ownerId, zone).rooms().get(0).plants();

        assertThat(plants).extracting(GardenPlantResponse::photoUrl)
                .containsExactly("https://storage.test/george.jpg?signed", null);
    }

    @Test
    void getGarden_includesEachPlantsWateringStreakInTheUsersTimeZone() {
        Planter balcony = planter("Balcony");
        Plant george = plant("George", balcony, 4);
        Plant pinky = plant("Pinky", balcony, 4);
        List<Plant> plants = List.of(george, pinky);
        when(planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)).thenReturn(List.of(balcony));
        when(plantService.getLivingPlants(ownerId)).thenReturn(plants);
        when(plantService.getWateringStreaks(plants, zone)).thenReturn(Map.of(george.getId(), 5, pinky.getId(), 0));

        List<GardenPlantResponse> response = gardenService().getGarden(ownerId, zone).rooms().get(0).plants();

        assertThat(response).extracting(GardenPlantResponse::wateringStreak).containsExactly(5, 0);
    }
}
