package com.myplunt.species;

import com.myplunt.constants.ApiPaths;
import com.myplunt.species.dto.DiscoveredSpeciesResponse;
import com.myplunt.species.dto.SpeciesResponse;
import com.myplunt.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class SpeciesController {

    private final SpeciesService speciesService;

    public SpeciesController(SpeciesService speciesService) {
        this.speciesService = speciesService;
    }

    @GetMapping(ApiPaths.Species.BASE)
    public List<SpeciesResponse> species() {
        return speciesService.getApprovedSpecies();
    }

    @GetMapping(ApiPaths.Species.DISCOVERED)
    public List<DiscoveredSpeciesResponse> discovered(@AuthenticationPrincipal User principal) {
        return speciesService.getDiscoveredSpecies(principal.getId());
    }
}
