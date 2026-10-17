package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.constants.ApiPaths;
import org.springframework.http.HttpStatus;
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

    public AdminSpeciesController(AdminSpeciesService adminSpeciesService) {
        this.adminSpeciesService = adminSpeciesService;
    }

    @GetMapping(ApiPaths.Admin.PENDING_SPECIES)
    public List<PendingSpeciesResponse> pending() {
        return adminSpeciesService.getPendingSpecies();
    }

    @PostMapping(ApiPaths.Admin.APPROVE_SPECIES)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable UUID id) {
        adminSpeciesService.approve(id);
    }

    @DeleteMapping(ApiPaths.Admin.PENDING_SPECIES_BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@PathVariable UUID id) {
        adminSpeciesService.reject(id);
    }
}
