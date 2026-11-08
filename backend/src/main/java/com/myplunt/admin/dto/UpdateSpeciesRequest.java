package com.myplunt.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

// region, wateringFrequencyDays and sunlightNeeds are optional; blank text is stored as null.
public record UpdateSpeciesRequest(
        @NotBlank(message = "Name must not be blank.")
                @Size(max = 255, message = "Name must be at most 255 characters.")
                String commonName,
        @NotBlank(message = "Scientific name must not be blank.")
                @Size(max = 255, message = "Scientific name must be at most 255 characters.")
                String scientificName,
        @Size(max = 255, message = "Region must be at most 255 characters.") String region,
        @Positive(message = "Watering must be at least 1 day.") Integer wateringFrequencyDays,
        @Size(max = 255, message = "Sunlight must be at most 255 characters.") String sunlightNeeds,
        boolean common) {

    public UpdateSpeciesRequest {
        commonName = commonName == null ? null : commonName.strip();
        scientificName = scientificName == null ? null : scientificName.strip();
        region = blankToNull(region);
        sunlightNeeds = blankToNull(sunlightNeeds);
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }
}
