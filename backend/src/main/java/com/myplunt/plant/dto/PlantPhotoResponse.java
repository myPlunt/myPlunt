package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

// One photo in the plant's growth timeline. url is a short-lived read link.
public record PlantPhotoResponse(UUID id, String url, Instant takenAt, String caption) {
}
