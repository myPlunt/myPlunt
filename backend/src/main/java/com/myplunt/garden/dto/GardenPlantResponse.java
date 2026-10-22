package com.myplunt.garden.dto;

import java.time.Instant;
import java.util.UUID;

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
