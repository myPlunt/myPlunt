package com.myplunt.garden;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.garden.dto.GardenPlantResponse;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.garden.dto.RoomResponse;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantService;
import com.myplunt.plant.WateringSchedule;
import com.myplunt.species.Species;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GardenService {

    static final String UNASSIGNED_ROOM_NAME = "Other plants";

    private static final Logger log = LoggerFactory.getLogger(GardenService.class);

    private final PlanterRepository planterRepository;
    private final PlantService plantService;

    public GardenService(PlanterRepository planterRepository, PlantService plantService) {
        this.planterRepository = planterRepository;
        this.plantService = plantService;
    }

    @Transactional(readOnly = true)
    public GardenResponse getGarden(UUID ownerId, ZoneId zone) {
        List<Plant> plants = plantService.getLivingPlants(ownerId);
        List<UUID> plantIds = plants.stream().map(Plant::getId).toList();
        Map<UUID, Instant> lastWatered = plantService.getLastWateredAt(plantIds);
        Map<UUID, String> photoUrls = plantService.getPhotoUrls(plantIds);
        Map<UUID, Integer> streaks = plantService.getWateringStreaks(plants, zone);

        Map<UUID, List<GardenPlantResponse>> plantsByRoom = new LinkedHashMap<>();
        for (Plant plant : plants) {
            plantsByRoom.computeIfAbsent(plant.getPlanterId(), id -> new ArrayList<>())
                    .add(toResponse(
                            plant, lastWatered.get(plant.getId()), streaks.getOrDefault(plant.getId(), 0), photoUrls.get(plant.getId())));
        }

        List<RoomResponse> rooms = new ArrayList<>();
        List<Planter> planters = planterRepository.findByOwnerIdOrderByCreatedAtAsc(ownerId);
        for (Planter planter : planters) {
            rooms.add(new RoomResponse(
                    planter.getId(), planter.getName(), plantsByRoom.getOrDefault(planter.getId(), List.of())));
        }
        reportPlantsInUnknownPlanters(ownerId, plantsByRoom, planters);
        if (plantsByRoom.containsKey(null)) {
            rooms.add(new RoomResponse(null, UNASSIGNED_ROOM_NAME, plantsByRoom.get(null)));
        }
        return new GardenResponse(rooms);
    }

    // Can't happen (PlantService checks the planter), but if it does those plants vanish from the garden.
    private static void reportPlantsInUnknownPlanters(
            UUID ownerId, Map<UUID, List<GardenPlantResponse>> plantsByRoom, List<Planter> planters) {
        Set<UUID> known = planters.stream().map(Planter::getId).collect(Collectors.toSet());
        List<UUID> missing = plantsByRoom.entrySet().stream()
                .filter(room -> room.getKey() != null && !known.contains(room.getKey()))
                .flatMap(room -> room.getValue().stream().map(GardenPlantResponse::id))
                .toList();
        if (!missing.isEmpty()) {
            StructuredLog.bug(log, LogEvent.PLANT_IN_UNKNOWN_PLANTER, Map.of("owner_id", ownerId, "plant_ids", missing));
        }
    }

    private GardenPlantResponse toResponse(Plant plant, Instant lastWateredAt, int wateringStreak, String photoUrl) {
        Species species = plant.getSpecies();
        return new GardenPlantResponse(
                plant.getId(),
                plant.getName(),
                species == null ? null : species.getId(),
                species == null ? null : species.getCommonName(),
                WateringSchedule.frequencyDays(plant),
                lastWateredAt,
                WateringSchedule.nextWateringAt(plant, lastWateredAt),
                wateringStreak,
                photoUrl);
    }
}
