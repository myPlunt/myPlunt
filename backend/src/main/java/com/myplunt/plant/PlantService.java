package com.myplunt.plant;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

@Service
public class PlantService {

    private final PlantRepository plantRepository;
    private final WateringLogRepository wateringLogRepository;

    public PlantService(PlantRepository plantRepository, WateringLogRepository wateringLogRepository) {
        this.plantRepository = plantRepository;
        this.wateringLogRepository = wateringLogRepository;
    }

    @Transactional
    public void water(UUID userId, UUID plantId) {
        // Someone else's plant answers "not found" too, so ids of other users' plants don't leak.
        Plant plant = plantRepository.findByIdAndOwnerId(plantId, userId)
                .orElseThrow(() -> new IllegalStateException("Plant not found"));
        if (!plant.isAlive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This plant has passed away and can't be watered");
        }
        wateringLogRepository.save(new WateringLog(plant, userId, Instant.now()));
    }
}
