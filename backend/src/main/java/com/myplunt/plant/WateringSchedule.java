package com.myplunt.plant;

import com.myplunt.species.Species;

import java.time.Duration;
import java.time.Instant;

public final class WateringSchedule {

    public static final int DEFAULT_FREQUENCY_DAYS = 7;

    private WateringSchedule() {}

    public static int frequencyDays(Plant plant) {
        if (plant.getWateringEveryDays() != null) {
            return plant.getWateringEveryDays();
        }
        Species species = plant.getSpecies();
        return species != null && species.getWateringFrequencyDays() != null
                ? species.getWateringFrequencyDays()
                : DEFAULT_FREQUENCY_DAYS;
    }

    public static Instant nextWateringAt(Plant plant, Instant lastWateredAt) {
        return (lastWateredAt != null ? lastWateredAt : plant.getCreatedAt()).plus(Duration.ofDays(frequencyDays(plant)));
    }
}
