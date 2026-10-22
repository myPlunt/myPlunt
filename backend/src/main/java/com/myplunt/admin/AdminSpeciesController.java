package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.constants.ApiPaths;
import com.myplunt.species.SpeciesService;
import com.myplunt.species.dto.SpeciesResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class AdminSpeciesController {

    private final AdminSpeciesService adminSpeciesService;
    private final SpeciesService speciesService;

    public AdminSpeciesController(AdminSpeciesService adminSpeciesService, SpeciesService speciesService) {
        this.adminSpeciesService = adminSpeciesService;
        this.speciesService = speciesService;
    }

    @GetMapping(ApiPaths.Admin.SPECIES)
    public List<SpeciesResponse> approved() {
        return speciesService.getApprovedSpecies();
    }

    @GetMapping(ApiPaths.Admin.PENDING_SPECIES)
    public List<PendingSpeciesResponse> pending() {
        return adminSpeciesService.getPendingSpecies();
    }

    @PostMapping(ApiPaths.Admin.APPROVE_SPECIES)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@AuthenticationPrincipal AdminUser admin, @PathVariable UUID id) {
        adminSpeciesService.approve(id, admin.getId());
    }

    @DeleteMapping(ApiPaths.Admin.PENDING_SPECIES_BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@AuthenticationPrincipal AdminUser admin, @PathVariable UUID id) {
        adminSpeciesService.reject(id, admin.getId());
    }
}
