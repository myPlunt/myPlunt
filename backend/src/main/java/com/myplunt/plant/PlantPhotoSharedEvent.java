package com.myplunt.plant;

import java.util.UUID;

public record PlantPhotoSharedEvent(UUID ownerId, PlantPhoto photo, String comment) {}
