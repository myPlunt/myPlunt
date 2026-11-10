package com.myplunt.admin.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PendingSpeciesResponse(
        UUID id,
        String commonName,
        String scientificName,
        List<String> regions,
        Integer wateringFrequencyDays,
        String sunlightNeeds,
        String imageUrl,
        String submittedBy,
        Instant submittedAt) {
}
