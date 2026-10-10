package com.myplunt.plant;

import com.myplunt.garden.PlanterRepository;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesRepository;
import com.myplunt.storage.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlantService {

    private final PlantRepository plantRepository;
    private final WateringLogRepository wateringLogRepository;
    private final PlanterRepository planterRepository;
    private final SpeciesRepository speciesRepository;
    private final PlantPhotoRepository plantPhotoRepository;
    private final StorageService storageService;

    public PlantService(
            PlantRepository plantRepository,
            WateringLogRepository wateringLogRepository,
            PlanterRepository planterRepository,
            SpeciesRepository speciesRepository,
            PlantPhotoRepository plantPhotoRepository,
            StorageService storageService) {
        this.plantRepository = plantRepository;
        this.wateringLogRepository = wateringLogRepository;
        this.planterRepository = planterRepository;
        this.speciesRepository = speciesRepository;
        this.plantPhotoRepository = plantPhotoRepository;
        this.storageService = storageService;
    }

    @Transactional
    public PlantResponse create(UUID ownerId, CreatePlantRequest request) {
        // Someone else's planter answers "not found" too, so ids of other users' planters don't leak.
        if (request.planterId() != null && !planterRepository.existsByIdAndOwnerId(request.planterId(), ownerId)) {
            throw new IllegalStateException("Planter not found");
        }

        // Unapproved species aren't offered in the app, so they answer "not found" too.
        Species species = request.speciesId() == null
                ? null
                : speciesRepository.findByIdAndApprovedTrue(request.speciesId())
                        .orElseThrow(() -> new IllegalStateException("Species not found"));

        // Confirmed before anything is saved: a key that isn't the owner's, is missing or is too
        // big fails here (404/400) and no plant is created. Confirming also keeps the bucket's
        // lifecycle rule from deleting the upload.
        if (request.photoKey() != null) {
            storageService.confirmUpload(ownerId, request.photoKey());
        }

        Plant plant = new Plant(ownerId, request.name());
        plant.setPlanterId(request.planterId());
        plant.setSpecies(species);
        plant.setLight(request.light());
        plant.setWateringEveryDays(request.wateringEveryDays());
        plant.setNotes(request.notes() == null || request.notes().isBlank() ? null : request.notes().strip());

        Plant saved = plantRepository.save(plant);
        if (request.photoKey() != null) {
            plantPhotoRepository.save(new PlantPhoto(saved, ownerId, request.photoKey(), Instant.now()));
        }
        return new PlantResponse(
                saved.getId(),
                saved.getName(),
                saved.getLight(),
                saved.getWateringEveryDays(),
                saved.getNotes(),
                saved.getPlanterId(),
                species == null ? null : species.getId(),
                request.photoKey() == null ? null : storageService.createReadUrl(request.photoKey()));
    }

    // The owner's living plants, oldest first, with their species already loaded.
    @Transactional(readOnly = true)
    public List<Plant> getLivingPlants(UUID ownerId) {
        return plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId);
    }

    // When each plant was last watered. Plants that were never watered are left out of the map.
    @Transactional(readOnly = true)
    public Map<UUID, Instant> getLastWateredAt(List<UUID> plantIds) {
        if (plantIds.isEmpty()) {
            return Map.of();
        }
        return wateringLogRepository.findLastWateredAt(plantIds).stream()
                .collect(Collectors.toMap(LastWatering::plantId, LastWatering::wateredAt));
    }

    @Transactional
    public void water(UUID userId, UUID plantId) {
        // Someone else's plant answers "not found" too, so ids of other users' plants don't leak.
        Plant plant = plantRepository.findByIdAndOwnerId(plantId, userId)
                .orElseThrow(() -> new IllegalStateException("Plant not found"));
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered");
        }
        wateringLogRepository.save(new WateringLog(plant, userId, Instant.now()));
    }
}
