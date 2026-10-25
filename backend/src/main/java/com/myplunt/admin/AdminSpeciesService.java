package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.common.logging.AuditEvent;
import com.myplunt.common.logging.AuditLog;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesService;
import com.myplunt.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public AdminSpeciesService(SpeciesService speciesService, StorageService storageService, AuditLog auditLog) {
        this.speciesService = speciesService;
        this.storageService = storageService;
        this.auditLog = auditLog;
    }

    @Transactional(readOnly = true)
    public List<PendingSpeciesResponse> getPendingSpecies() {
        return speciesService.findPending().stream()
                .map(species -> new PendingSpeciesResponse(
                        species.getId(),
                        species.getCommonName(),
                        species.getScientificName(),
                        species.getRegion(),
                        species.getWateringFrequencyDays(),
                        species.getSunlightNeeds(),
                        species.getImageKey() == null ? null : storageService.createReadUrl(species.getImageKey()),
                        species.getSubmittedBy() == null ? null : species.getSubmittedBy().getUsername(),
                        species.getUpdatedAt()))
                .toList();
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
