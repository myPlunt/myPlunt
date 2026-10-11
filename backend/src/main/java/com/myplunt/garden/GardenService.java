package com.myplunt.garden;

import com.myplunt.garden.dto.GardenPlantResponse;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.garden.dto.RoomResponse;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantService;
import com.myplunt.plant.WateringSchedule;
import com.myplunt.species.Species;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GardenService {

    static final String UNASSIGNED_ROOM_NAME = "Other plants";

    private final PlanterRepository planterRepository;
    private final PlantService plantService;

    public GardenService(PlanterRepository planterRepository, PlantService plantService) {
        this.planterRepository = planterRepository;
        this.plantService = plantService;
    }

    // The user's living plants grouped by room, in the order the rooms were created.
    // Empty rooms are included; plants without a room come last, in their own group.
    @Transactional(readOnly = true)
    public GardenResponse getGarden(UUID ownerId) {
        List<Plant> plants = plantService.getLivingPlants(ownerId);
        Map<UUID, Instant> lastWatered = plantService.getLastWateredAt(plants.stream().map(Plant::getId).toList());

        // LinkedHashMap allows the null key used for plants without a room.
        Map<UUID, List<GardenPlantResponse>> plantsByRoom = new LinkedHashMap<>();
        for (Plant plant : plants) {
            plantsByRoom.computeIfAbsent(plant.getPlanterId(), id -> new ArrayList<>())
                    .add(toResponse(plant, lastWatered.get(plant.getId())));
        }

        List<RoomResponse> rooms = new ArrayList<>();
        for (Planter planter : planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId)) {
            rooms.add(new RoomResponse(
                    planter.getId(), planter.getName(), plantsByRoom.getOrDefault(planter.getId(), List.of())));
        }
        if (plantsByRoom.containsKey(null)) {
            rooms.add(new RoomResponse(null, UNASSIGNED_ROOM_NAME, plantsByRoom.get(null)));
        }
        return new GardenResponse(rooms);
    }

    private GardenPlantResponse toResponse(Plant plant, Instant lastWateredAt) {
        Species species = plant.getSpecies();
        return new GardenPlantResponse(
                plant.getId(),
                plant.getName(),
                species == null ? null : species.getCommonName(),
                WateringSchedule.frequencyDays(plant),
                lastWateredAt,
                WateringSchedule.nextWateringAt(plant, lastWateredAt));
    }
}
