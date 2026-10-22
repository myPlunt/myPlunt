package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

public record WateringLogResponse(UUID id, UUID plantId, String plantName, Instant wateredAt) {
}
