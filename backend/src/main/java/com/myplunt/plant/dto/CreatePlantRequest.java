package com.myplunt.plant.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreatePlantRequest(
        @NotBlank(message = "Name must not be blank.")
                @Size(min = 3, max = 255, message = "Name must be between 3 and 255 characters.")
                String name,
        // Same values as the chk_plants_light constraint in V4.
        @Pattern(regexp = "full_sun|bright_indirect|partial_shade|low_light", message = "Light must be one of the listed options.")
                String light,
        @Min(value = 1, message = "Watering must be every 1 to 365 days.")
                @Max(value = 365, message = "Watering must be every 1 to 365 days.")
                Integer wateringEveryDays,
        @Size(max = 1000, message = "Notes must be at most 1000 characters.") String notes,
        // One of the owner's planters; null leaves the plant under "Other plants".
        UUID planterId,
        // An approved species; null when the owner doesn't know or didn't pick one.
        UUID speciesId,
        // Key of a photo the owner uploaded via /v1/photos/upload-url; null for no photo.
        @Size(max = 512, message = "Photo key must be at most 512 characters.") String photoKey) {

    // Strip before validation runs, so a name of only spaces counts as blank.
    public CreatePlantRequest {
        name = name == null ? null : name.strip();
    }
}
