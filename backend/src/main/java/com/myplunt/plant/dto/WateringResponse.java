package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

public record WateringResponse(UUID id, Instant wateredAt) {
}
