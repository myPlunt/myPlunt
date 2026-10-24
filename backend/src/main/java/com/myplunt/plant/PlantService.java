package com.myplunt.plant;

import com.myplunt.care.CareDelegation;
import com.myplunt.care.CareDelegationRepository;
import com.myplunt.common.exception.NotFoundException;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.garden.Planter;
import com.myplunt.garden.PlanterRepository;
import com.myplunt.notification.PushNotificationService;
import com.myplunt.plant.dto.AddPlantPhotoRequest;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantPhotoResponse;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.plant.dto.UpdatePlantPhotoRequest;
import com.myplunt.plant.dto.UpdatePlantRequest;
import com.myplunt.plant.dto.WateringHistoryResponse;
import com.myplunt.plant.dto.WateringLogResponse;
import com.myplunt.plant.dto.WateringResponse;
import com.myplunt.plant.dto.WateringStreakResponse;
import com.myplunt.post.Post;
import com.myplunt.post.PostRepository;
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
    private final PostRepository postRepository;
    private final StorageService storageService;
    private final AuditLog auditLog;
    private final CareDelegationRepository careDelegationRepository;
    private final PushNotificationService pushNotificationService;

    public PlantService(
            PlantRepository plantRepository,
            WateringLogRepository wateringLogRepository,
            PlanterRepository planterRepository,
            SpeciesRepository speciesRepository,
            PlantPhotoRepository plantPhotoRepository,
            PostRepository postRepository,
            StorageService storageService,
            AuditLog auditLog,
            CareDelegationRepository careDelegationRepository,
            PushNotificationService pushNotificationService) {
        this.plantRepository = plantRepository;
        this.wateringLogRepository = wateringLogRepository;
        this.planterRepository = planterRepository;
        this.speciesRepository = speciesRepository;
        this.plantPhotoRepository = plantPhotoRepository;
        this.postRepository = postRepository;
        this.storageService = storageService;
        this.auditLog = auditLog;
        this.careDelegationRepository = careDelegationRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Transactional
    public PlantResponse create(UUID ownerId, CreatePlantRequest request) {
        requireOwnPlanter(ownerId, request.planterId());
        Species species = findApprovedSpecies(request.speciesId());
        // Before anything is saved, so a bad key creates nothing. Confirming also stops the bucket's
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
        boolean shareToFeed = Boolean.TRUE.equals(request.shareToFeed());
        if (shareToFeed) {
            postRepository.save(new Post(ownerId, saved, Post.NEW_PLANT));
        }
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("plant_id", saved.getId());
        details.put("species_id", speciesId(species));
        details.put("has_photo", request.photoKey() != null);
        details.put("shared_to_feed", shareToFeed);
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

    @Transactional
    public PlantDetailsResponse update(UUID ownerId, UUID plantId, UpdatePlantRequest request) {
        Plant plant = findOwnPlant(ownerId, plantId);
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be edited");
        }
        requireOwnPlanter(ownerId, request.planterId());
        Species species = findApprovedSpecies(request.speciesId());
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

    @Transactional(readOnly = true)
    public List<Plant> getLivingPlants(UUID ownerId) {
        return plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(ownerId);
    }

    @Transactional(readOnly = true)
    public Map<UUID, Instant> getLastWateredAt(List<UUID> plantIds) {
        if (plantIds.isEmpty()) {
            return Map.of();
        }
        return wateringLogRepository.findLastWateredAt(plantIds).stream()
                .collect(Collectors.toMap(LastWatering::plantId, LastWatering::wateredAt));
    }

    @Transactional(readOnly = true)
    public Map<UUID, String> getPhotoUrls(List<UUID> plantIds) {
        if (plantIds.isEmpty()) {
            return Map.of();
        }
        return plantPhotoRepository.findLatestPhotos(plantIds).stream()
                .collect(Collectors.toMap(
                        LatestPhoto::plantId,
                        photo -> storageService.createReadUrl(photo.photoKey()),
                        (first, second) -> first));
    }

    @Transactional
    public void water(UUID userId, UUID plantId, Instant wateredAt, ZoneId zone) {
        Plant plant = findPlantToWater(userId, plantId);
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered");
        }
        Instant now = Instant.now();
        Instant at = wateredAt == null || wateredAt.isAfter(now) ? now : wateredAt;
        List<Instant> earlier = wateringLogRepository.findByPlantIdOrderByWateredAtAsc(plantId).stream()
                .map(WateringLog::getWateredAt)
                .toList();
        if (earlier.contains(at)) {
            return;
        }
        wateringLogRepository.save(new WateringLog(plant, userId, at));
        recordWatering(userId, plant, earlier, at, zone);
        if (!plant.getOwnerId().equals(userId)) {
            pushNotificationService.sendSitterWatered(userId, plant.getOwnerId());
        }
    }

    private void recordWatering(UUID userId, Plant plant, List<Instant> earlier, Instant wateredAt, ZoneId zone) {
        // The streak as it stood at the previous watering, before any overdue days zeroed it.
        int streakBefore = earlier.isEmpty()
                ? 0
                : WateringConsistency.of(plant, earlier, zone, earlier.getLast()).currentStreak();
        List<Instant> all = new ArrayList<>(earlier);
        all.add(wateredAt);
        all.sort(null);
        int streak = WateringConsistency.of(plant, all, zone, all.getLast()).currentStreak();

        auditLog.recorded(AuditEvent.PLANT_WATERED, plant.getOwnerId(), userId, Map.of("plant_id", plant.getId(), "streak", streak));
        // No changed_by: the streak broke as a consequence of the watering, not by the user's choice.
        // Only the newest watering can break it.
        if (wateredAt.equals(all.getLast()) && streakBefore > 0 && streak == 0) {
            auditLog.recorded(AuditEvent.WATERING_STREAK_BROKEN, plant.getOwnerId(), null,
                    Map.of("plant_id", plant.getId(), "lost_streak", streakBefore));
        }
    }

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

    @Transactional(readOnly = true)
    public List<PlantPhotoResponse> getPhotos(UUID ownerId, UUID plantId) {
        findOwnPlant(ownerId, plantId);
        return plantPhotoRepository.findByPlantIdOrderByTakenAtAsc(plantId).stream()
                .map(this::toPhotoResponse)
                .toList();
    }

    @Transactional
    public PlantPhotoResponse addPhoto(UUID ownerId, UUID plantId, AddPlantPhotoRequest request) {
        Plant plant = findOwnPlant(ownerId, plantId);
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't get new photos");
        }
        storageService.confirmUpload(ownerId, request.photoKey());

        PlantPhoto photo = new PlantPhoto(
                plant, ownerId, request.photoKey(), request.takenAt() == null ? Instant.now() : request.takenAt());
        PlantPhoto saved = plantPhotoRepository.save(photo);
        boolean shareToFeed = Boolean.TRUE.equals(request.shareToFeed());
        String comment = shareToFeed ? cleanNotes(request.comment()) : null;
        if (shareToFeed) {
            postRepository.save(new Post(ownerId, saved, comment));
        }
        auditLog.recorded(AuditEvent.PLANT_PHOTO_ADDED, ownerId, ownerId, Map.of(
                "plant_id", plantId,
                "photo_id", saved.getId(),
                "has_comment", comment != null,
                "shared_to_feed", shareToFeed));
        return toPhotoResponse(saved);
    }

    @Transactional
    public PlantPhotoResponse updatePhoto(UUID ownerId, UUID plantId, UUID photoId, UpdatePlantPhotoRequest request) {
        Plant plant = findOwnPlant(ownerId, plantId);
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and its photos can't be edited");
        }
        PlantPhoto photo = findPhoto(plantId, photoId);
        String caption = cleanNotes(request.caption());
        List<String> changedFields = new ArrayList<>();
        if (!Objects.equals(photo.getTakenAt(), request.takenAt())) changedFields.add("taken_at");
        if (!Objects.equals(photo.getCaption(), caption)) changedFields.add("caption");
        photo.setTakenAt(request.takenAt());
        photo.setCaption(caption);

        PlantPhoto saved = plantPhotoRepository.save(photo);
        auditLog.recorded(AuditEvent.PLANT_PHOTO_UPDATED, ownerId, ownerId,
                Map.of("plant_id", plantId, "photo_id", photoId, "changed_fields", changedFields));
        return toPhotoResponse(saved);
    }

    // Feed posts of the photo go with it (ON DELETE CASCADE).
    @Transactional
    public void deletePhoto(UUID ownerId, UUID plantId, UUID photoId) {
        findOwnPlant(ownerId, plantId);
        PlantPhoto photo = findPhoto(plantId, photoId);
        plantPhotoRepository.delete(photo);
        auditLog.recorded(AuditEvent.PLANT_PHOTO_DELETED, ownerId, ownerId, Map.of("plant_id", plantId, "photo_id", photoId));
        // Flushed so the row is gone before the file is.
        plantPhotoRepository.flush();
        // A leftover file only costs storage.
        try {
            storageService.deleteObject(photo.getPhotoKey());
        } catch (RuntimeException e) {
            StructuredLog.warning(log, LogEvent.PHOTO_CLEANUP_FAILED, Map.of(
                    "plant_id", plantId, "photo_key", photo.getPhotoKey(), "reason", e.getClass().getSimpleName()));
        }
    }

    private PlantPhoto findPhoto(UUID plantId, UUID photoId) {
        return plantPhotoRepository.findByIdAndPlantId(photoId, plantId)
                .orElseThrow(() -> new NotFoundException("Photo not found"));
    }

    private PlantPhotoResponse toPhotoResponse(PlantPhoto photo) {
        return new PlantPhotoResponse(
                photo.getId(), storageService.createReadUrl(photo.getPhotoKey()), photo.getTakenAt(), photo.getCaption());
    }

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

    @Transactional(readOnly = true)
    public WateringStreakResponse getWateringStreak(UUID ownerId, ZoneId zone) {
        int total = getWateringStreaks(getLivingPlants(ownerId), zone).values().stream()
                .mapToInt(Integer::intValue)
                .sum();
        return new WateringStreakResponse(total);
    }

    // Its waterings, photos, delegations and posts go with it (ON DELETE CASCADE).
    @Transactional
    public void delete(UUID ownerId, UUID plantId) {
        Plant plant = findOwnPlant(ownerId, plantId);
        List<String> photoKeys = plantPhotoRepository.findPhotoKeysByPlantId(plantId);
        plantRepository.delete(plant);
        auditLog.recorded(AuditEvent.PLANT_DELETED, ownerId, ownerId,
                Map.of("plant_id", plantId, "photo_count", photoKeys.size()));
        // Flushed so the plant is gone before its files: a failed delete then leaves the photos in place.
        plantRepository.flush();
        for (String key : photoKeys) {
            // A leftover file only costs storage.
            try {
                storageService.deleteObject(key);
            } catch (RuntimeException e) {
                StructuredLog.warning(log, LogEvent.PHOTO_CLEANUP_FAILED, Map.of(
                        "plant_id", plantId, "photo_key", key, "reason", e.getClass().getSimpleName()));
            }
        }
    }

    // A plant sitter may water (only water) a friend's plant while their stay hasn't ended.
    private Plant findPlantToWater(UUID userId, UUID plantId) {
        Plant plant = plantRepository.findById(plantId).orElseThrow(() -> new IllegalStateException("Plant not found"));
        boolean sitting = careDelegationRepository.existsByPlantIdAndDelegatedToAndStatusAndActiveUntilAfter(
                plantId, userId, CareDelegation.ACTIVE, Instant.now());
        if (!plant.getOwnerId().equals(userId) && !sitting) {
            throw new IllegalStateException("Plant not found");
        }
        return plant;
    }

    private Plant findOwnPlant(UUID ownerId, UUID plantId) {
        return plantRepository.findByIdAndOwnerId(plantId, ownerId)
                .orElseThrow(() -> new NotFoundException("Plant not found"));
    }

    private void requireOwnPlanter(UUID ownerId, UUID planterId) {
        if (planterId != null && !planterRepository.existsByIdAndOwnerId(planterId, ownerId)) {
            throw new NotFoundException("Planter not found");
        }
    }

    private Species findApprovedSpecies(UUID speciesId) {
        return speciesId == null
                ? null
                : speciesRepository.findByIdAndApprovedTrue(speciesId)
                        .orElseThrow(() -> new NotFoundException("Species not found"));
    }

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
