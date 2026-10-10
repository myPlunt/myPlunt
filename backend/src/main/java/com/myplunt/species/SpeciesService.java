package com.myplunt.species;

import com.myplunt.species.dto.SpeciesResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SpeciesService {

    private final SpeciesRepository speciesRepository;

    public SpeciesService(SpeciesRepository speciesRepository) {
        this.speciesRepository = speciesRepository;
    }

    // Every approved species, by common name. The list is small for now, so the app
    // searches it locally; the Plantdex will need server-side search and paging.
    @Transactional(readOnly = true)
    public List<SpeciesResponse> getApprovedSpecies() {
        return speciesRepository.findByApprovedTrueOrderByCommonNameAsc().stream()
                .map(species -> new SpeciesResponse(
                        species.getId(),
                        species.getCommonName(),
                        species.getScientificName(),
                        species.getWateringFrequencyDays()))
                .toList();
    }
}
