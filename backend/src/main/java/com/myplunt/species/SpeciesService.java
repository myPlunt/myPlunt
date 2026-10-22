package com.myplunt.species;

import com.myplunt.species.dto.DiscoveredSpeciesResponse;
import com.myplunt.species.dto.SpeciesResponse;
import com.myplunt.storage.StorageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SpeciesService {

    private final SpeciesRepository speciesRepository;
    private final StorageService storageService;

    public SpeciesService(SpeciesRepository speciesRepository, StorageService storageService) {
        this.speciesRepository = speciesRepository;
        this.storageService = storageService;
    }

    // shortcut: returns every species and the app searches locally; add server-side search and paging
    // when the list grows.
    @Transactional(readOnly = true)
    public List<SpeciesResponse> getApprovedSpecies() {
        return speciesRepository.findByApprovedTrueOrderByCommonNameAsc().stream()
                .map(species -> new SpeciesResponse(
                        species.getId(),
                        species.getCommonName(),
                        species.getScientificName(),
                        species.getWateringFrequencyDays(),
                        species.getRegion(),
                        species.getSunlightNeeds(),
                        species.isCommon(),
                        // Signing is local (no call to storage), so one per species is cheap.
                        species.getImageKey() == null ? null : storageService.createReadUrl(species.getImageKey())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DiscoveredSpeciesResponse> getDiscoveredSpecies(UUID userId) {
        return speciesRepository.findDiscoveredSpecies(userId).stream()
                .map(discovered -> new DiscoveredSpeciesResponse(discovered.getSpeciesId(), discovered.getDiscoveredAt()))
                .toList();
    }
}
