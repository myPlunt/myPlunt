package com.myplunt.plant;

import com.myplunt.garden.Planter;
import com.myplunt.garden.PlanterRepository;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.plant.dto.UpdatePlantRequest;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesRepository;
import com.myplunt.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(PlantService.class);

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
        requireOwnPlanter(ownerId, request.planterId());
        Species species = findApprovedSpecies(request.speciesId());
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
        plant.setNotes(cleanNotes(request.notes()));

        Plant saved = plantRepository.save(plant);
        markCaught(ownerId, species);
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

    @Transactional(readOnly = true)
    public PlantDetailsResponse getDetails(UUID ownerId, UUID plantId) {
        return toDetails(findOwnPlant(ownerId, plantId));
    }

    // Replaces the editable fields. The photo only changes when a new one was uploaded.
    @Transactional
    public PlantDetailsResponse update(UUID ownerId, UUID plantId, UpdatePlantRequest request) {
        Plant plant = findOwnPlant(ownerId, plantId);
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be edited");
        }
        requireOwnPlanter(ownerId, request.planterId());
        Species species = findApprovedSpecies(request.speciesId());
        // Confirmed before anything changes, for the same reasons as in create.
        if (request.photoKey() != null) {
            storageService.confirmUpload(ownerId, request.photoKey());
        }

        plant.setName(request.name());
        plant.setPlanterId(request.planterId());
        plant.setSpecies(species);
        plant.setLight(request.light());
        plant.setWateringEveryDays(request.wateringEveryDays());
        plant.setNotes(cleanNotes(request.notes()));

        Plant saved = plantRepository.save(plant);
        markCaught(ownerId, species);
        if (request.photoKey() != null) {
            plantPhotoRepository.save(new PlantPhoto(saved, ownerId, request.photoKey(), Instant.now()));
        }
        return toDetails(saved);
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

    // A short-lived link to each plant's current photo. Plants without a photo are left out of the map.
    @Transactional(readOnly = true)
    public Map<UUID, String> getPhotoUrls(List<UUID> plantIds) {
        if (plantIds.isEmpty()) {
            return Map.of();
        }
        return plantPhotoRepository.findLatestPhotos(plantIds).stream()
                .collect(Collectors.toMap(
                        LatestPhoto::plantId,
                        photo -> storageService.createReadUrl(photo.photoKey()),
                        // Two photos taken at the same moment: either will do.
                        (first, second) -> first));
    }

    @Transactional
    public void water(UUID userId, UUID plantId) {
        Plant plant = findOwnPlant(userId, plantId);
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered");
        }
        wateringLogRepository.save(new WateringLog(plant, userId, Instant.now()));
    }

    // Removes the plant from the garden for good, dead or alive. Its waterings, photos, care
    // delegations and posts go with it (ON DELETE CASCADE in V1).
    @Transactional
    public void delete(UUID ownerId, UUID plantId) {
        Plant plant = findOwnPlant(ownerId, plantId);
        List<String> photoKeys = plantPhotoRepository.findPhotoKeysByPlantId(plantId);
        plantRepository.delete(plant);
        // Flushed first so the plant is really gone before its files are; a failed delete
        // then leaves the photos in place.
        plantRepository.flush();
        for (String key : photoKeys) {
            // The plant is already gone for the user, so a leftover file only costs storage.
            try {
                storageService.deleteObject(key);
            } catch (RuntimeException e) {
                log.warn("Could not delete photo {} of deleted plant {}", key, plantId, e);
            }
        }
    }

    // Someone else's plant answers "not found" too, so ids of other users' plants don't leak.
    private Plant findOwnPlant(UUID ownerId, UUID plantId) {
        return plantRepository.findByIdAndOwnerId(plantId, ownerId)
                .orElseThrow(() -> new IllegalStateException("Plant not found"));
    }

    // Someone else's planter answers "not found" too, for the same reason. Null means no planter.
    private void requireOwnPlanter(UUID ownerId, UUID planterId) {
        if (planterId != null && !planterRepository.existsByIdAndOwnerId(planterId, ownerId)) {
            throw new IllegalStateException("Planter not found");
        }
    }

    // Unapproved species aren't offered in the app, so they answer "not found" too. Null means no species.
    private Species findApprovedSpecies(UUID speciesId) {
        return speciesId == null
                ? null
                : speciesRepository.findByIdAndApprovedTrue(speciesId)
                        .orElseThrow(() -> new IllegalStateException("Species not found"));
    }

    // Adds the species to the owner's Pluntdex. Deleting the plant later doesn't undo it.
    private void markCaught(UUID ownerId, Species species) {
        if (species != null) {
            speciesRepository.markCaught(ownerId, species.getId());
        }
    }

    private static String cleanNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.strip();
    }

    private PlantDetailsResponse toDetails(Plant plant) {
        Species species = plant.getSpecies();
        String planterName = plant.getPlanterId() == null
                ? null
                : planterRepository.findByIdAndOwnerId(plant.getPlanterId(), plant.getOwnerId())
                        .map(Planter::getName)
                        .orElse(null);
        Instant lastWateredAt = getLastWateredAt(List.of(plant.getId())).get(plant.getId());
        String photoUrl = getPhotoUrls(List.of(plant.getId())).get(plant.getId());
        return new PlantDetailsResponse(
                plant.getId(),
                plant.getName(),
                plant.getLight(),
                plant.getWateringEveryDays(),
                plant.getNotes(),
                plant.getPlanterId(),
                planterName,
                species == null ? null : species.getId(),
                species == null ? null : species.getCommonName(),
                WateringSchedule.frequencyDays(plant),
                lastWateredAt,
                WateringSchedule.nextWateringAt(plant, lastWateredAt),
                photoUrl);
    }
}
