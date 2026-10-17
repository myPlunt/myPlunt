package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.species.SpeciesRepository;
import com.myplunt.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// The species users submitted, for the dashboard's review list. Nothing the admin app does is
// logged (see CLAUDE.md).
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
}
