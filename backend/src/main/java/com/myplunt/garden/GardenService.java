package com.myplunt.garden;

import com.myplunt.garden.dto.GardenPlantResponse;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.garden.dto.RoomResponse;
import com.myplunt.plant.LastWatering;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.plant.WateringLogRepository;
import com.myplunt.species.Species;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GardenService {

    static final String UNASSIGNED_ROOM_NAME = "Other plants";

    private final PlanterRepository planterRepository;
    private final PlantRepository plantRepository;
    private final WateringLogRepository wateringLogRepository;

    public GardenService(
            PlanterRepository planterRepository,
            PlantRepository plantRepository,
            WateringLogRepository wateringLogRepository) {
        this.planterRepository = planterRepository;
        this.plantRepository = plantRepository;
        this.wateringLogRepository = wateringLogRepository;
    }

    // The user's living plants grouped by room, in the order the rooms were created.
    // Empty rooms are included; plants without a room come last, in their own group.
    @Transactional(readOnly = true)
    public GardenResponse getGarden(UUID ownerId) {
        List<Plant> plants = plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId);
        Map<UUID, Instant> lastWatered = plants.isEmpty()
                ? Map.of()
                : wateringLogRepository.findLastWateredAt(plants.stream().map(Plant::getId).toList()).stream()
                        .collect(Collectors.toMap(LastWatering::plantId, LastWatering::wateredAt));

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
        Integer frequencyDays = species == null ? null : species.getWateringFrequencyDays();
        // A plant that was never watered counts from the day it was added.
        Instant nextWateringAt = frequencyDays == null
                ? null
                : (lastWateredAt != null ? lastWateredAt : plant.getCreatedAt()).plus(Duration.ofDays(frequencyDays));
        return new GardenPlantResponse(
                plant.getId(),
                plant.getName(),
                species == null ? null : species.getCommonName(),
                frequencyDays,
                lastWateredAt,
                nextWateringAt);
    }
}
