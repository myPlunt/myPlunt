package com.myplunt.plant;

import java.util.UUID;

public record LatestPhoto(UUID plantId, String photoKey) {
}
