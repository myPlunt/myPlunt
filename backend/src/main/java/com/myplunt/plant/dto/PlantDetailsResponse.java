package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

// One plant with everything its details page shows. wateringEveryDays is the owner's own
// setting (null when they left it to the species); wateringFrequencyDays is the one in use.
// planterName, speciesName, the watering fields and photoUrl are null when there's none.
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
