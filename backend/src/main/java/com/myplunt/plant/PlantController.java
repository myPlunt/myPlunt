package com.myplunt.plant;

import com.myplunt.constants.ApiPaths;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.user.User;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class PlantController {

    private final PlantService plantService;

    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }

    // The new plant always belongs to the signed-in user (JwtAuthFilter's principal).
    @PostMapping(ApiPaths.Plants.BASE)
    @ResponseStatus(HttpStatus.CREATED)
    public PlantResponse create(@AuthenticationPrincipal User principal, @Valid @RequestBody CreatePlantRequest request) {
        return plantService.create(principal.getId(), request);
    }

    @PostMapping(ApiPaths.Plants.WATERINGS)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void water(@AuthenticationPrincipal User principal, @PathVariable UUID plantId) {
        plantService.water(principal.getId(), plantId);
    }
}
