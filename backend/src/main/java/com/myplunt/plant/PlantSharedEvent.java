package com.myplunt.plant;

import java.util.UUID;

public record PlantSharedEvent(UUID ownerId, Plant plant) {}
