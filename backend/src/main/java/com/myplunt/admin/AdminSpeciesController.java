package com.myplunt.admin;

import com.myplunt.admin.dto.PendingSpeciesResponse;
import com.myplunt.constants.ApiPaths;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
}
