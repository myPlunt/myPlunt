package com.myplunt.admin;

import com.myplunt.constants.ApiPaths;
import com.myplunt.region.RegionService;
import com.myplunt.region.dto.RegionResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class AdminRegionController {

    private final RegionService regionService;

    public AdminRegionController(RegionService regionService) {
        this.regionService = regionService;
    }

    // The world map and the species form's region choices, in display order.
    @GetMapping(ApiPaths.Admin.REGIONS)
    public List<RegionResponse> regions() {
        return regionService.getRegions();
    }
}
