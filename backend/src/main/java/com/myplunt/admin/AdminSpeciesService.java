package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.species.Species;
import com.myplunt.species.SpeciesRepository;
import com.myplunt.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

// The species users submitted: the dashboard's review list, and approving or rejecting them.
// Nothing the admin app does is logged (see CLAUDE.md).
@Service
public class AdminSpeciesService {

    private final SpeciesRepository speciesRepository;
    private final StorageService storageService;

    public AdminSpeciesService(SpeciesRepository speciesRepository, StorageService storageService) {
        this.speciesRepository = speciesRepository;
        this.storageService = storageService;
    }

    @Transactional(readOnly = true)
    public List<PendingSpeciesResponse> getPendingSpecies() {
        return speciesRepository.findPendingWithSubmitter().stream()
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

    // Approved species show up in the Pluntdex and the add-plant search.
    @Transactional
    public void approve(UUID id) {
        findPending(id).approve();
    }

    // Plants that used the species keep their own data (species_id is set to null), and
    // discoveries of it are removed with it. The picture stays in storage: seeded species share
    // theirs with every reseed of the staging database.
    @Transactional
    public void reject(UUID id) {
        speciesRepository.delete(findPending(id));
    }

    // Already-approved species answer "not found" too: the dashboard only reviews pending ones.
    private Species findPending(UUID id) {
        return speciesRepository.findByIdAndApprovedFalse(id)
                .orElseThrow(() -> new IllegalStateException("Species not found"));
    }
}
