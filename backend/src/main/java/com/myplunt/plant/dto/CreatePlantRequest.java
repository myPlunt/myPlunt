package com.myplunt.plant.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePlantRequest(
        @NotBlank(message = "Name must not be blank.")
                @Size(max = 255, message = "Name must be at most 255 characters.")
                String name,
        // Same values as the chk_plants_light constraint in V4.
        @Pattern(regexp = "full_sun|bright_indirect|partial_shade|low_light", message = "Light must be one of the listed options.")
                String light,
        @Min(value = 1, message = "Watering must be every 1 to 365 days.")
                @Max(value = 365, message = "Watering must be every 1 to 365 days.")
                Integer wateringEveryDays,
        @Size(max = 1000, message = "Notes must be at most 1000 characters.") String notes,
        // One of the owner's planters; null leaves the plant under "Other plants".
        UUID planterId) {

    // Strip before validation runs, so a name of only spaces counts as blank.
    public CreatePlantRequest {
        name = name == null ? null : name.strip();
    }
}
