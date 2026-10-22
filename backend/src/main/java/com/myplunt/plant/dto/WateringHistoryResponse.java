package com.myplunt.plant.dto;

import java.util.List;

public record WateringHistoryResponse(
        String plantName,
        int wateringFrequencyDays,
        int currentStreak,
        int bestStreak,
        Integer onTimePercent,
        boolean overdue,
        List<WateringResponse> waterings) {
}
