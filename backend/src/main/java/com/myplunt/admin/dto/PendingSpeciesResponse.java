package com.myplunt.admin.dto;

import java.time.Instant;
import java.util.UUID;

// A species waiting for an admin's approval. The care fields and imageUrl (a short-lived link) are
// null when the submitter left them out; submittedBy (a username) when no user submitted it or the
// account was deleted.
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
