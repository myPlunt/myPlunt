package com.myplunt.plant;

import com.myplunt.constants.ApiPaths;
import com.myplunt.plant.dto.AddPlantPhotoRequest;
import com.myplunt.plant.dto.CreatePlantRequest;
import com.myplunt.plant.dto.PlantDetailsResponse;
import com.myplunt.plant.dto.PlantPhotoResponse;
import com.myplunt.plant.dto.PlantResponse;
import com.myplunt.plant.dto.UpdatePlantPhotoRequest;
import com.myplunt.plant.dto.UpdatePlantRequest;
import com.myplunt.plant.dto.WateringHistoryResponse;
import com.myplunt.user.User;
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

import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
public class PlantController {

    private final PlantService plantService;

    public PlantController(PlantService plantService) {
        this.plantService = plantService;
    }

    @PostMapping(ApiPaths.Plants.BASE)
    @ResponseStatus(HttpStatus.CREATED)
    public PlantResponse create(@AuthenticationPrincipal User principal, @Valid @RequestBody CreatePlantRequest request) {
        return plantService.create(principal.getId(), request);
    }

    @GetMapping(ApiPaths.Plants.BY_ID)
    public PlantDetailsResponse get(@AuthenticationPrincipal User principal, @PathVariable UUID plantId) {
        return plantService.getDetails(principal.getId(), plantId);
    }

    @PutMapping(ApiPaths.Plants.BY_ID)
    public PlantDetailsResponse update(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID plantId,
            @Valid @RequestBody UpdatePlantRequest request) {
        return plantService.update(principal.getId(), plantId, request);
    }

    @DeleteMapping(ApiPaths.Plants.BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal User principal, @PathVariable UUID plantId) {
        plantService.delete(principal.getId(), plantId);
    }

    @GetMapping(ApiPaths.Plants.PHOTOS)
    public List<PlantPhotoResponse> photos(@AuthenticationPrincipal User principal, @PathVariable UUID plantId) {
        return plantService.getPhotos(principal.getId(), plantId);
    }

    @PostMapping(ApiPaths.Plants.PHOTOS)
    @ResponseStatus(HttpStatus.CREATED)
    public PlantPhotoResponse addPhoto(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID plantId,
            @Valid @RequestBody AddPlantPhotoRequest request) {
        return plantService.addPhoto(principal.getId(), plantId, request);
    }

    @PutMapping(ApiPaths.Plants.PHOTO_BY_ID)
    public PlantPhotoResponse updatePhoto(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID plantId,
            @PathVariable UUID photoId,
            @Valid @RequestBody UpdatePlantPhotoRequest request) {
        return plantService.updatePhoto(principal.getId(), plantId, photoId, request);
    }

    @DeleteMapping(ApiPaths.Plants.PHOTO_BY_ID)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePhoto(@AuthenticationPrincipal User principal, @PathVariable UUID plantId, @PathVariable UUID photoId) {
        plantService.deletePhoto(principal.getId(), plantId, photoId);
    }

    @PostMapping(ApiPaths.Plants.WATERINGS)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void water(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID plantId,
            @RequestParam(defaultValue = "UTC") ZoneId zone) {
        plantService.water(principal.getId(), plantId, zone);
    }

    @GetMapping(ApiPaths.Plants.WATERINGS)
    public WateringHistoryResponse wateringHistory(
            @AuthenticationPrincipal User principal,
            @PathVariable UUID plantId,
            @RequestParam(defaultValue = "UTC") ZoneId zone) {
        return plantService.getWateringHistory(principal.getId(), plantId, zone);
    }
}
