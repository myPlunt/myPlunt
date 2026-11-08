package com.myplunt.admin.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// What an admin may correct before approving: the care details and the region. Blank text clears it.
public record UpdatePendingSpeciesRequest(
        @Size(max = 255, message = "Region must be at most 255 characters.") String region,
        @NotNull(message = "Watering must not be empty.")
        @Min(value = 1, message = "Watering must be between 1 and 365 days.")
        @Max(value = 365, message = "Watering must be between 1 and 365 days.") Integer wateringFrequencyDays,
        @Size(max = 255, message = "Sunlight must be at most 255 characters.") String sunlightNeeds) {
}
