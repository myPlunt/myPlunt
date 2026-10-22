package com.myplunt.species.dto;

import java.util.UUID;

public record SpeciesResponse(
        UUID id,
        String commonName,
        String scientificName,
        Integer wateringFrequencyDays,
        String region,
        String sunlightNeeds,
        boolean common,
        String imageUrl) {
}
