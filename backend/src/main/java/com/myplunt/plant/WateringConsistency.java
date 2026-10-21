package com.myplunt.plant;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

// How consistently a plant has been watered. Each watering is due frequencyDays calendar days
// after the one before it (the first after the day the plant was added), in the user's time
// zone, the same rule that turns the app's watering pill to "Overdue". The streak only grows
// with a watering on its due day: watering early isn't late, so it doesn't break the streak,
// but the plant didn't need it yet, so it doesn't add to it either (it does restart the
// schedule). A late watering breaks it. A second watering on the same day doesn't count again,
// so tapping the drop twice can't grow a streak. Uses today's schedule for the whole history,
// since older ones aren't kept.
//
// daysLate has one entry per watering, oldest first; 0 means not late. currentStreak is 0 once
// the plant is overdue. onTimePercent is the share of watering days that weren't late, null
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
            long daysAfterDue = ChronoUnit.DAYS.between(previousDay.plusDays(frequencyDays), wateredOn);
            int late = (int) Math.max(0, daysAfterDue);
            daysLate.add(late);
            // The first watering may fall on the day the plant was added; that still counts.
            if (first || !wateredOn.equals(previousDay)) {
                countedDays++;
                if (late > 0) {
                    streak = 0;
                } else {
                    onTimeDays++;
                    if (daysAfterDue == 0) {
                        streak++;
                        bestStreak = Math.max(bestStreak, streak);
                    }
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
