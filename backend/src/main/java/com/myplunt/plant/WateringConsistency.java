package com.myplunt.plant;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

// How consistently a plant has been watered. Each watering is due frequencyDays calendar days
// after the one before it (the first after the day the plant was added), in the user's time
// zone, the same rule that turns the app's watering pill to "Overdue". Watering early is on
// time. A second watering on the same day doesn't count again, so tapping the drop twice
// can't grow a streak. Uses today's schedule for the whole history, since older ones aren't kept.
//
// daysLate has one entry per watering, oldest first; 0 means on time. currentStreak is 0 once
// the plant is overdue. onTimePercent is the share of watering days that were on time, null
// before the first watering.
public record WateringConsistency(
        List<Integer> daysLate,
        int currentStreak,
        int bestStreak,
        Integer onTimePercent,
        boolean overdue) {

    public static WateringConsistency of(Plant plant, List<Instant> wateredAtOldestFirst, ZoneId zone, Instant now) {
        int frequencyDays = WateringSchedule.frequencyDays(plant);
        List<Integer> daysLate = new ArrayList<>();
        LocalDate previousDay = day(plant.getCreatedAt(), zone);
        boolean first = true;
        int onTimeDays = 0;
        int countedDays = 0;
        int streak = 0;
        int bestStreak = 0;

        for (Instant wateredAt : wateredAtOldestFirst) {
            LocalDate wateredOn = day(wateredAt, zone);
            int late = (int) Math.max(0, ChronoUnit.DAYS.between(previousDay.plusDays(frequencyDays), wateredOn));
            daysLate.add(late);
            // The first watering may fall on the day the plant was added; that still counts.
            if (first || !wateredOn.equals(previousDay)) {
                countedDays++;
                if (late == 0) {
                    onTimeDays++;
                    streak++;
                    bestStreak = Math.max(bestStreak, streak);
                } else {
                    streak = 0;
                }
            }
            previousDay = wateredOn;
            first = false;
        }

        boolean overdue = day(now, zone).isAfter(previousDay.plusDays(frequencyDays));
        return new WateringConsistency(
                daysLate,
                overdue ? 0 : streak,
                bestStreak,
                countedDays == 0 ? null : Math.round(onTimeDays * 100f / countedDays),
                overdue);
    }

    private static LocalDate day(Instant instant, ZoneId zone) {
        return instant.atZone(zone).toLocalDate();
    }
}
