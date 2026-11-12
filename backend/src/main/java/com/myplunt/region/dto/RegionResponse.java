package com.myplunt.region.dto;

import java.util.List;
import java.util.UUID;

// parent: the name of the region this one is part of (Europe), or null.
public record RegionResponse(
        UUID id,
        String name,
        String slug,
        String parent,
        List<String> countries) {
}
