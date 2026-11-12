package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.admin.dto.UpdatePendingSpeciesRequest;
import com.myplunt.constants.ApiPaths;
import com.myplunt.species.SpeciesImportService;
import com.myplunt.species.dto.SpeciesImportResponse;
import com.myplunt.species.dto.SpeciesResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
public class AdminSpeciesController {

    private final AdminSpeciesService adminSpeciesService;
    private final SpeciesImportService speciesImportService;

    public AdminSpeciesController(AdminSpeciesService adminSpeciesService, SpeciesImportService speciesImportService) {
        this.adminSpeciesService = adminSpeciesService;
        this.speciesImportService = speciesImportService;
    }

    @GetMapping(ApiPaths.Admin.SPECIES)
    public List<SpeciesResponse> approved() {
        return adminSpeciesService.getApprovedSpecies();
    }

    @PutMapping(ApiPaths.Admin.SPECIES_BY_ID)
    public SpeciesResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateSpeciesRequest request) {
        return adminSpeciesService.update(id, request);
    }

    @GetMapping(ApiPaths.Admin.PENDING_SPECIES)
    public List<PendingSpeciesResponse> pending() {
        return adminSpeciesService.getPendingSpecies();
    }

    // Lets the admin correct an imported or submitted species before approving it.
    @PutMapping(ApiPaths.Admin.PENDING_SPECIES_BY_ID)
    public PendingSpeciesResponse update(@PathVariable UUID id, @Valid @RequestBody UpdatePendingSpeciesRequest request) {
        return adminSpeciesService.update(id, request);
    }

    @PostMapping(ApiPaths.Admin.APPROVE_SPECIES)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@AuthenticationPrincipal AdminUser admin, @PathVariable UUID id) {
        adminSpeciesService.approve(id, admin.getId());
    }

    // Rejects every imported pending species at once, e.g. a bad import. Users' submissions and approved
    // species are never touched.
    @DeleteMapping(ApiPaths.Admin.PENDING_SPECIES)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectAll(@AuthenticationPrincipal AdminUser admin) {
        adminSpeciesService.rejectAll(admin.getId());
    }

    @DeleteMapping(ApiPaths.Admin.PENDING_SPECIES_BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@AuthenticationPrincipal AdminUser admin, @PathVariable UUID id) {
        adminSpeciesService.reject(id, admin.getId());
    }

    // Imported species land in the pending list for review.
    @PostMapping(ApiPaths.Admin.IMPORT_SPECIES)
    public SpeciesImportResponse importSpecies(@RequestParam(defaultValue = "1") int count,
                                               @RequestParam(defaultValue = "1") int page) {
        // Capped under Trefle's 60 requests a minute: one details request per species, plus the list pages.
        return speciesImportService.importSpecies(Math.clamp(count, 1, 50), Math.max(page, 1));
    }
}
