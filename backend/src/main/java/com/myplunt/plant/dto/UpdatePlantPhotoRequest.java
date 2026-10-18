package com.myplunt.plant.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.Instant;

// Replaces a growth photo's date and note; a null caption removes the note. The picture
// itself can't change: a different picture is a new photo.
public record UpdatePlantPhotoRequest(
        @NotNull(message = "Date taken must not be empty.")
                @PastOrPresent(message = "The photo can't be taken in the future.")
                Instant takenAt,
        @Size(max = 280, message = "Note must be at most 280 characters.") String caption) {
}
