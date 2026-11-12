package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.admin.dto.UpdatePendingSpeciesRequest;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.region.RegionService;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesOptions;
import com.myplunt.species.SpeciesService;
import com.myplunt.species.dto.SpeciesResponse;
import com.myplunt.storage.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// Approving and rejecting are the only admin actions that are logged.
@Service
public class AdminSpeciesService {

    private final SpeciesService speciesService;
    private final StorageService storageService;
    private final AuditLog auditLog;
    private final RegionService regionService;

    public AdminSpeciesService(SpeciesService speciesService, StorageService storageService, AuditLog auditLog,
                               RegionService regionService) {
        this.speciesService = speciesService;
        this.storageService = storageService;
        this.auditLog = auditLog;
        this.regionService = regionService;
    }

    public List<SpeciesResponse> getApprovedSpecies() {
        return speciesService.getApprovedSpecies();
    }

    @Transactional(readOnly = true)
    public List<PendingSpeciesResponse> getPendingSpecies() {
        return speciesService.findPending().stream().map(this::toResponse).toList();
    }

    // Only pending species: approved ones are already in users' gardens.
    @Transactional
    public PendingSpeciesResponse update(UUID id, UpdatePendingSpeciesRequest request) {
        Species species = speciesService.findPending(id);
        species.updateCare(regionService.findSpeciesRegions(request.regions()), request.wateringFrequencyDays(),
                blankToNull(request.sunlightNeeds()));
        return toResponse(species);
    }

    private PendingSpeciesResponse toResponse(Species species) {
        return new PendingSpeciesResponse(
                species.getId(),
                species.getCommonName(),
                species.getScientificName(),
                species.getRegionNames(),
                species.getWateringFrequencyDays(),
                species.getSunlightNeeds(),
                species.getImageKey() == null ? null : storageService.createReadUrl(species.getImageKey()),
                species.getSubmittedBy() == null ? null : species.getSubmittedBy().getUsername(),
                species.getUpdatedAt());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    // Plants read the species live: a new watering applies right away to plants without their own.
    @Transactional
    public SpeciesResponse update(UUID id, UpdateSpeciesRequest request) {
        Species species = speciesService.findApproved(id);
        if (request.region() != null && !SpeciesOptions.REGIONS.contains(request.region())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick a region from the list.");
        }
        if (request.sunlightNeeds() != null && !SpeciesOptions.SUNLIGHT.contains(request.sunlightNeeds())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pick a sunlight option from the list.");
        }
        if (speciesService.scientificNameTaken(request.scientificName(), id)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Another species is already called " + request.scientificName());
        }
        species.update(request.commonName(), request.scientificName(), request.region(),
                request.wateringFrequencyDays(), request.sunlightNeeds(), request.common());
        return speciesService.toResponse(species);
    }

    @Transactional
    public void approve(UUID id, UUID adminId) {
        Species species = speciesService.findPending(id);
        species.approve();
        record(AuditEvent.SPECIES_APPROVED, species, adminId);
    }

    // The picture stays in storage: seeded species share theirs across staging reseeds.
    @Transactional
    public void reject(UUID id, UUID adminId) {
        Species species = speciesService.findPending(id);
        speciesService.delete(species);
        record(AuditEvent.SPECIES_REJECTED, species, adminId);
    }

    // Only species no user submitted, so clearing a bad import never loses a user's submission.
    // Imported pictures belong to their species alone, so they go with it; seeded ones stay (see reject).
    @Transactional
    public void rejectAll(UUID adminId) {
        for (Species species : speciesService.findPending()) {
            if (species.getSubmittedBy() != null) {
                continue;
            }
            speciesService.delete(species);
            record(AuditEvent.SPECIES_REJECTED, species, adminId);
            if (species.getImageKey() != null && species.getImageKey().contains("/imported.")) {
                storageService.deleteObject(species.getImageKey());
            }
        }
    }

    // Names are logged too: a rejected species no longer exists to look its id up.
    private void record(AuditEvent event, Species species, UUID adminId) {
        UUID submitterId = species.getSubmittedBy() == null ? null : species.getSubmittedBy().getId();
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("species_id", species.getId());
        details.put("common_name", species.getCommonName());
        details.put("scientific_name", species.getScientificName());
        auditLog.recorded(event, submitterId, adminId, details);
    }
}
