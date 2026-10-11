package com.myplunt.garden.dto;

import java.time.Instant;
import java.util.UUID;

// speciesId and speciesName are null when the plant has no species, and photoUrl (a short-lived link) when it
// has no photo. wateringFrequencyDays and nextWateringAt are null when there's no watering
// schedule. The app turns nextWateringAt into "Water today" in the user's own time zone.
public record GardenPlantResponse(
        UUID id,
        String name,
        UUID speciesId,
        String speciesName,
        Integer wateringFrequencyDays,
        Instant lastWateredAt,
        Instant nextWateringAt,
        String photoUrl) {
}
