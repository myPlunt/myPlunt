package com.myplunt.plant;

import java.time.Instant;
import java.util.UUID;

public record LastWatering(UUID plantId, Instant wateredAt) {
}
