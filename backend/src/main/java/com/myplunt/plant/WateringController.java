package com.myplunt.plant;

import com.myplunt.constants.ApiPaths;
import com.myplunt.plant.dto.WateringLogResponse;
import com.myplunt.plant.dto.WateringStreakResponse;
import com.myplunt.user.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.ZoneId;
import java.util.List;

@RestController
public class WateringController {

    private final PlantService plantService;

    public WateringController(PlantService plantService) {
        this.plantService = plantService;
    }

    // from is inclusive and to exclusive, so the app can ask for exactly one month in its own time zone.
    @GetMapping(ApiPaths.Waterings.BASE)
    public List<WateringLogResponse> waterings(
            @AuthenticationPrincipal User principal, @RequestParam Instant from, @RequestParam Instant to) {
        return plantService.getWaterings(principal.getId(), from, to);
    }

    @GetMapping(ApiPaths.Waterings.STREAK)
    public WateringStreakResponse streak(
            @AuthenticationPrincipal User principal, @RequestParam(defaultValue = "UTC") ZoneId zone) {
        return plantService.getWateringStreak(principal.getId(), zone);
    }
}
