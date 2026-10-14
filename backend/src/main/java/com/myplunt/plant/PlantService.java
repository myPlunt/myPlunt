package com.myplunt.plant;

import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.garden.Planter;
import com.myplunt.garden.PlanterRepository;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.plant.dto.UpdatePlantRequest;
import com.myplunt.plant.dto.WateringHistoryResponse;
import com.myplunt.plant.dto.WateringLogResponse;
import com.myplunt.plant.dto.WateringResponse;
import com.myplunt.plant.dto.WateringStreakResponse;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesRepository;
import com.myplunt.storage.StorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
    private final AuditLog auditLog;

    public PlantService(
            PlantRepository plantRepository,
            WateringLogRepository wateringLogRepository,
            PlanterRepository planterRepository,
            SpeciesRepository speciesRepository,
            PlantPhotoRepository plantPhotoRepository,
            StorageService storageService,
            AuditLog auditLog) {
        this.plantRepository = plantRepository;
        this.wateringLogRepository = wateringLogRepository;
        this.planterRepository = planterRepository;
        this.speciesRepository = speciesRepository;
        this.plantPhotoRepository = plantPhotoRepository;
        this.storageService = storageService;
        this.auditLog = auditLog;
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
        markDiscovered(ownerId, species);
        if (request.photoKey() != null) {
            plantPhotoRepository.save(new PlantPhoto(saved, ownerId, request.photoKey(), Instant.now()));
        }
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("plant_id", saved.getId());
        details.put("species_id", speciesId(species));
        details.put("has_photo", request.photoKey() != null);
        auditLog.recorded(AuditEvent.PLANT_CREATED, ownerId, ownerId, details);
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

        List<String> changedFields = changedFields(plant, request, species);
        plant.setName(request.name());
        plant.setPlanterId(request.planterId());
        plant.setSpecies(species);
        plant.setLight(request.light());
        plant.setWateringEveryDays(request.wateringEveryDays());
        plant.setNotes(cleanNotes(request.notes()));

        Plant saved = plantRepository.save(plant);
        markDiscovered(ownerId, species);
        if (request.photoKey() != null) {
            plantPhotoRepository.save(new PlantPhoto(saved, ownerId, request.photoKey(), Instant.now()));
        }
        auditLog.recorded(AuditEvent.PLANT_UPDATED, ownerId, ownerId,
                Map.of("plant_id", plantId, "changed_fields", changedFields));
        return toDetails(saved);
    }

    // Names only: the name and notes are the user's own words, so their values stay out of the log.
    private List<String> changedFields(Plant plant, UpdatePlantRequest request, Species species) {
        List<String> changed = new ArrayList<>();
        if (!plant.getName().equals(request.name())) changed.add("name");
        if (!Objects.equals(plant.getPlanterId(), request.planterId())) changed.add("planter_id");
        if (!Objects.equals(speciesId(plant.getSpecies()), speciesId(species))) changed.add("species_id");
        if (!Objects.equals(plant.getLight(), request.light())) changed.add("light");
        if (!Objects.equals(plant.getWateringEveryDays(), request.wateringEveryDays())) changed.add("watering_every_days");
        if (!Objects.equals(plant.getNotes(), cleanNotes(request.notes()))) changed.add("notes");
        if (request.photoKey() != null) changed.add("photo");
        return changed;
    }

    private static UUID speciesId(Species species) {
        return species == null ? null : species.getId();
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

    // zone is only used to count the streak days for the action log.
    @Transactional
    public void water(UUID userId, UUID plantId, ZoneId zone) {
        Plant plant = findOwnPlant(userId, plantId);
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered");
        }
        List<Instant> earlier = wateringLogRepository.findByPlantIdOrderByWateredAtAsc(plantId).stream()
                .map(WateringLog::getWateredAt)
                .toList();
        Instant now = Instant.now();
        wateringLogRepository.save(new WateringLog(plant, userId, now));
        recordWatering(userId, plant, earlier, now, zone);
    }

    private void recordWatering(UUID userId, Plant plant, List<Instant> earlier, Instant now, ZoneId zone) {
        // The streak as it stood at the previous watering, before any overdue days zeroed it.
        int streakBefore = earlier.isEmpty()
                ? 0
                : WateringConsistency.of(plant, earlier, zone, earlier.getLast()).currentStreak();
        List<Instant> all = new ArrayList<>(earlier);
        all.add(now);
        int streak = WateringConsistency.of(plant, all, zone, now).currentStreak();

        auditLog.recorded(AuditEvent.PLANT_WATERED, userId, userId, Map.of("plant_id", plant.getId(), "streak", streak));
        // A late watering is the only thing that resets a streak to 0. No changed_by: it's the
        // consequence of the watering, not something the user chose.
        if (streakBefore > 0 && streak == 0) {
            auditLog.recorded(AuditEvent.WATERING_STREAK_BROKEN, userId, null,
                    Map.of("plant_id", plant.getId(), "lost_streak", streakBefore));
        }
    }

    // Also for plants that have died, so their record stays readable. Days are counted in the
    // user's time zone, so "on time" flips at their own midnight.
    @Transactional(readOnly = true)
    public WateringHistoryResponse getWateringHistory(UUID ownerId, UUID plantId, ZoneId zone) {
        Plant plant = findOwnPlant(ownerId, plantId);
        List<WateringLog> waterings = wateringLogRepository.findByPlantIdOrderByWateredAtAsc(plantId);
        WateringConsistency consistency = WateringConsistency.of(
                plant, waterings.stream().map(WateringLog::getWateredAt).toList(), zone, Instant.now());

        List<WateringResponse> newestFirst = new ArrayList<>();
        for (int i = waterings.size() - 1; i >= 0; i--) {
            WateringLog watering = waterings.get(i);
            newestFirst.add(new WateringResponse(watering.getId(), watering.getWateredAt(), consistency.daysLate().get(i)));
        }
        return new WateringHistoryResponse(
                plant.getName(),
                WateringSchedule.frequencyDays(plant),
                consistency.currentStreak(),
                consistency.bestStreak(),
                consistency.onTimePercent(),
                consistency.overdue(),
                newestFirst);
    }

    // Each plant's current watering streak (see WateringConsistency), in one query for all of them.
    @Transactional(readOnly = true)
    public Map<UUID, Integer> getWateringStreaks(List<Plant> plants, ZoneId zone) {
        if (plants.isEmpty()) {
            return Map.of();
        }
        Map<UUID, List<Instant>> wateredAt = wateringLogRepository
                .findByPlantIdInOrderByWateredAtAsc(plants.stream().map(Plant::getId).toList()).stream()
                .collect(Collectors.groupingBy(
                        watering -> watering.getPlant().getId(),
                        Collectors.mapping(WateringLog::getWateredAt, Collectors.toList())));
        Instant now = Instant.now();
        return plants.stream().collect(Collectors.toMap(
                Plant::getId,
                plant -> WateringConsistency.of(plant, wateredAt.getOrDefault(plant.getId(), List.of()), zone, now)
                        .currentStreak()));
    }

    // The longest range the watering calendar may ask for at once, so one request can't read years of logs.
    static final Duration MAX_WATERINGS_RANGE = Duration.ofDays(62);

    @Transactional(readOnly = true)
    public List<WateringLogResponse> getWaterings(UUID ownerId, Instant from, Instant to) {
        if (!to.isAfter(from)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The end of the range must be after its start");
        }
        if (Duration.between(from, to).compareTo(MAX_WATERINGS_RANGE) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ask for at most 62 days of waterings at once");
        }
        return wateringLogRepository.findOwnersWaterings(ownerId, from, to);
    }

    // Living plants only: a plant that died no longer has a streak to keep up.
    @Transactional(readOnly = true)
    public WateringStreakResponse getWateringStreak(UUID ownerId, ZoneId zone) {
        int total = getWateringStreaks(getLivingPlants(ownerId), zone).values().stream()
                .mapToInt(Integer::intValue)
                .sum();
        return new WateringStreakResponse(total);
    }

    // Removes the plant from the garden for good, dead or alive. Its waterings, photos, care
    // delegations and posts go with it (ON DELETE CASCADE in V1).
    @Transactional
    public void delete(UUID ownerId, UUID plantId) {
        Plant plant = findOwnPlant(ownerId, plantId);
        List<String> photoKeys = plantPhotoRepository.findPhotoKeysByPlantId(plantId);
        plantRepository.delete(plant);
        auditLog.recorded(AuditEvent.PLANT_DELETED, ownerId, ownerId,
                Map.of("plant_id", plantId, "photo_count", photoKeys.size()));
        // Flushed first so the plant is really gone before its files are; a failed delete
        // then leaves the photos in place.
        plantRepository.flush();
        for (String key : photoKeys) {
            // The plant is already gone for the user, so a leftover file only costs storage.
            try {
                storageService.deleteObject(key);
            } catch (RuntimeException e) {
                StructuredLog.warning(log, LogEvent.PHOTO_CLEANUP_FAILED, Map.of(
                        "plant_id", plantId, "photo_key", key, "reason", e.getClass().getSimpleName()));
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
    private void markDiscovered(UUID ownerId, Species species) {
        if (species != null) {
            speciesRepository.markDiscovered(ownerId, species.getId());
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
