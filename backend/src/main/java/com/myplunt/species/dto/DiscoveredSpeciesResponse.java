package com.myplunt.species.dto;

import java.time.Instant;
import java.util.UUID;

// A species the user has discovered, and when: the first time they owned a plant of it.
public record DiscoveredSpeciesResponse(UUID speciesId, Instant discoveredAt) {
}
