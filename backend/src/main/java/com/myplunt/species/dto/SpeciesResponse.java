package com.myplunt.species.dto;

import java.util.UUID;

// wateringFrequencyDays is null when the species has no known schedule.
public record SpeciesResponse(UUID id, String commonName, String scientificName, Integer wateringFrequencyDays) {
}
