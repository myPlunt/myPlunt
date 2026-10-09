package com.myplunt.garden;

import com.myplunt.constants.ApiPaths;
import com.myplunt.garden.dto.GardenResponse;
import com.myplunt.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class GardenController {

    private final GardenService gardenService;

    public GardenController(GardenService gardenService) {
        this.gardenService = gardenService;
    }

    @GetMapping(ApiPaths.Garden.BASE)
    public GardenResponse garden(@AuthenticationPrincipal User principal) {
        return gardenService.getGarden(principal.getId());
    }
}
