package com.myplunt.plant.dto;

import java.util.List;

// Every watering of one plant, newest first, and how consistent they were (see
// WateringConsistency). wateringFrequencyDays is the schedule in use (see WateringSchedule).
// onTimePercent is null before the first watering.
public record WateringHistoryResponse(
        String plantName,
        int wateringFrequencyDays,
        int currentStreak,
        int bestStreak,
        Integer onTimePercent,
        boolean overdue,
        List<WateringResponse> waterings) {
}
