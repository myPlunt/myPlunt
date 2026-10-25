package com.myplunt.plant;

import java.util.UUID;

public record SitterWateredEvent(UUID sitterId, UUID ownerId) {}
