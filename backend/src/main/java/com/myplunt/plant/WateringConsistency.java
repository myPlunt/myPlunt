package com.myplunt.plant;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

// Each watering is due frequencyDays calendar days (in the user's zone) after the previous one, or
// after the plant was added. Only a watering on its due day grows the streak; an early one neither
// grows nor breaks it but restarts the schedule, a late one breaks it, and a second one on the same
// day doesn't count. Today's frequency is used for the whole history, since older ones aren't kept.
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
