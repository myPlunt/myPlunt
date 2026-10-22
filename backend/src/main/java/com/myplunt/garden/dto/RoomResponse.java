package com.myplunt.garden.dto;

import java.util.List;
import java.util.UUID;

// id is null for the group of plants that aren't in a room yet.
public record RoomResponse(UUID id, String name, List<GardenPlantResponse> plants) {
}
