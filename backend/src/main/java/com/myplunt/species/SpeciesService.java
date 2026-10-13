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

    // Every approved species, by common name. The list is small for now, so the app
    // searches it locally; the Pluntdex will need server-side search and paging.
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

    // The species the user has ever owned a plant of, including plants since deleted, and when.
    @Transactional(readOnly = true)
    public List<DiscoveredSpeciesResponse> getDiscoveredSpecies(UUID userId) {
        return speciesRepository.findDiscoveredSpecies(userId).stream()
                .map(discovered -> new DiscoveredSpeciesResponse(discovered.getSpeciesId(), discovered.getDiscoveredAt()))
                .toList();
    }
}
