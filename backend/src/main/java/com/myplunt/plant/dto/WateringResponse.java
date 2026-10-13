package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

// daysLate is 0 for a watering on or before its due day (see WateringConsistency).
public record WateringResponse(UUID id, Instant wateredAt, int daysLate) {
}
