package com.myplunt.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record PendingSpeciesResponse(
        UUID id,
        String commonName,
        String scientificName,
        String region,
        Integer wateringFrequencyDays,
        String sunlightNeeds,
        String imageUrl,
        String submittedBy,
        Instant submittedAt) {
}
