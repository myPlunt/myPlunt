package com.myplunt.garden.dto;

import java.time.Instant;
import java.util.UUID;

// speciesName is null when the plant has no species, and photoUrl (a short-lived link) when it
// has no photo. wateringFrequencyDays and nextWateringAt are always set: every
// plant has a watering schedule (see WateringSchedule). The app turns nextWateringAt into "Water today" in the user's own time zone.
// wateringStreak is the current run of on-time waterings (see WateringConsistency), 0 when there's none.
public record GardenPlantResponse(
        UUID id,
        String name,
        UUID speciesId,
        String speciesName,
        Integer wateringFrequencyDays,
        Instant lastWateredAt,
        Instant nextWateringAt,
        int wateringStreak,
        String photoUrl) {
}
