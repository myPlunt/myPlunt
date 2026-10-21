package com.myplunt.user.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// city is null when the phone couldn't name the place the coordinates are in.
public record UpdateLocationRequest(
        @NotNull(message = "Latitude must not be blank.")
                @DecimalMin(value = "-90", message = "Latitude must be between -90 and 90.")
                @DecimalMax(value = "90", message = "Latitude must be between -90 and 90.")
                Double latitude,
        @NotNull(message = "Longitude must not be blank.")
                @DecimalMin(value = "-180", message = "Longitude must be between -180 and 180.")
                @DecimalMax(value = "180", message = "Longitude must be between -180 and 180.")
                Double longitude,
        @Size(max = 255, message = "City must be at most 255 characters.") String city) {}
