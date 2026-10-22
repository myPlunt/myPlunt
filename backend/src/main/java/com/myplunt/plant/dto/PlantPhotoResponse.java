package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.UUID;

public record PlantPhotoResponse(UUID id, String url, Instant takenAt, String caption) {
}
