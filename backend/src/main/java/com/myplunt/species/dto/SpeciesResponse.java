package com.myplunt.species.dto;

import java.util.UUID;

// wateringFrequencyDays is null when the species has no known schedule, region when it's
// unknown, and imageUrl (a short-lived link) when the species has no picture yet.
public record SpeciesResponse(
        UUID id,
        String commonName,
        String scientificName,
        Integer wateringFrequencyDays,
        String region,
        boolean common,
        String imageUrl) {
}
