package com.myplunt.species.dto;

import java.time.Instant;
import java.util.UUID;

public record DiscoveredSpeciesResponse(UUID speciesId, Instant discoveredAt) {
}
