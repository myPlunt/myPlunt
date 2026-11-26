package com.myplunt.plant;

import java.util.UUID;

// photo is the plant's first photo (null if it has none), so the post keeps it when newer photos are added.
public record PlantSharedEvent(UUID ownerId, Plant plant, PlantPhoto photo) {}
