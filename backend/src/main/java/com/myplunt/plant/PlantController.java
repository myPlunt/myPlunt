package com.myplunt.plant;

import com.myplunt.constants.ApiPaths;
import com.myplunt.user.User;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class PlantController {

    private final PlantService plantService;

    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }

    @PostMapping(ApiPaths.Plants.WATERINGS)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void water(@AuthenticationPrincipal User principal, @PathVariable UUID plantId) {
        plantService.water(principal.getId(), plantId);
    }
}
