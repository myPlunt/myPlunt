package com.myplunt.species.dto;

import java.util.List;
import java.util.UUID;

public record SpeciesResponse(
        UUID id,
        String commonName,
        String scientificName,
        Integer wateringFrequencyDays,
        List<String> regions,
        String sunlightNeeds,
        boolean common,
        String imageUrl) {
}
