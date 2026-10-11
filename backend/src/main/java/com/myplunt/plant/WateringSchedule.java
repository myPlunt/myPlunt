package com.myplunt.plant;

import com.myplunt.species.Species;

import java.time.Duration;
import java.time.Instant;

// When a plant needs water. Shared by the garden and a plant's details, so both show the same date.
// Every plant has a schedule: an owner who skips "water every N days" gets a default one.
public final class WateringSchedule {

    // For a plant whose owner set no frequency and whose species has none (or that has no species).
    public static final int DEFAULT_FREQUENCY_DAYS = 7;

    private WateringSchedule() {}

    // The owner's own "water every N days" wins over the species' frequency, which wins over the default.
    public static int frequencyDays(Plant plant) {
        if (plant.getWateringEveryDays() != null) {
            return plant.getWateringEveryDays();
        }
        Species species = plant.getSpecies();
        return species != null && species.getWateringFrequencyDays() != null
                ? species.getWateringFrequencyDays()
                : DEFAULT_FREQUENCY_DAYS;
    }

    // A plant that was never watered counts from the day it was added.
    public static Instant nextWateringAt(Plant plant, Instant lastWateredAt) {
        return (lastWateredAt != null ? lastWateredAt : plant.getCreatedAt()).plus(Duration.ofDays(frequencyDays(plant)));
    }
}
