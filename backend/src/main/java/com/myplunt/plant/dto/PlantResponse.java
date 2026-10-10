package com.myplunt.plant.dto;

import java.util.UUID;

// photoUrl is a short-lived read link, null when the plant has no photo.
public record PlantResponse(
        UUID id,
        String name,
        String light,
        Integer wateringEveryDays,
        String notes,
        UUID planterId,
        UUID speciesId,
        String photoUrl) {
}
