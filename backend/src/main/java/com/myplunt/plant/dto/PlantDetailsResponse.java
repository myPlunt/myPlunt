package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

// wateringEveryDays is the owner's own setting (null if unset); wateringFrequencyDays is the one in use.
public record PlantDetailsResponse(
        UUID id,
        String name,
        String light,
        Integer wateringEveryDays,
        String notes,
        UUID planterId,
        String planterName,
        UUID speciesId,
        String speciesName,
        Integer wateringFrequencyDays,
        Instant lastWateredAt,
        Instant nextWateringAt,
        String photoUrl) {
}
