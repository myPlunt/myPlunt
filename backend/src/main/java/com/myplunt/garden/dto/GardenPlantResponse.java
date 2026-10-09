package com.myplunt.garden.dto;

import java.time.Instant;
import java.util.UUID;

// speciesName is null when the plant has no species. wateringFrequencyDays and
// nextWateringAt are null when there's no watering schedule. The app turns nextWateringAt into "Water today" in the user's own time zone.
public record GardenPlantResponse(
        UUID id,
        String name,
        String speciesName,
        Integer wateringFrequencyDays,
        Instant lastWateredAt,
        Instant nextWateringAt) {
}
