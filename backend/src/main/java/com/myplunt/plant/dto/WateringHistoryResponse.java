package com.myplunt.plant.dto;

import java.time.Instant;
import java.util.List;

// Every watering of one plant, newest first, with what the app needs to judge each one as on
// time or late: the schedule in use (see WateringSchedule) and the day the plant was added,
// which the first watering counts from. The app works out on time, late and streaks itself,
// in the user's own time zone, so "on time" flips at the same midnight as the garden's
// "Overdue".
public record WateringHistoryResponse(
        String plantName,
        int wateringFrequencyDays,
        Instant addedAt,
        List<WateringResponse> waterings) {
}
