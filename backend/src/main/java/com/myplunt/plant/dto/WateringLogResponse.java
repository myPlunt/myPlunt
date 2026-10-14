package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

// One watering of one of the user's plants, for the watering calendar on their profile.
public record WateringLogResponse(UUID id, UUID plantId, String plantName, Instant wateredAt) {
}
