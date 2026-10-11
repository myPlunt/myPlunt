package com.myplunt.plant;

import com.myplunt.species.Species;

import java.time.Duration;
import java.time.Instant;

// When a plant needs water. Shared by the garden and a plant's details, so both show the same date.
public final class WateringSchedule {

    private WateringSchedule() {}

    // The owner's own "water every N days" wins over the species' default; null without either.
    public static Integer frequencyDays(Plant plant) {
        Species species = plant.getSpecies();
        return plant.getWateringEveryDays() != null
                ? plant.getWateringEveryDays()
                : species == null ? null : species.getWateringFrequencyDays();
    }

    // A plant that was never watered counts from the day it was added. Null without a frequency.
    public static Instant nextWateringAt(Plant plant, Instant lastWateredAt) {
        Integer frequencyDays = frequencyDays(plant);
        return frequencyDays == null
                ? null
                : (lastWateredAt != null ? lastWateredAt : plant.getCreatedAt()).plus(Duration.ofDays(frequencyDays));
    }
}
