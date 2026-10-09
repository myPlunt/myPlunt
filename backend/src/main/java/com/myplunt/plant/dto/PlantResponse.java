package com.myplunt.plant.dto;

import java.util.UUID;

public record PlantResponse(UUID id, String name, String light, Integer wateringEveryDays, String notes) {
}
