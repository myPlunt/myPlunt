package com.myplunt.admin.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

// Days are UTC calendar days.
public record LogOverviewResponse(
        int days,
        long total,
        List<Count> byLevel,
        List<Count> byLocation,
        List<DayCount> perDay,
        List<EventCount> topActions,
        List<EventCount> topProblems) {

    public record Count(String name, long count) {}

    public record DayCount(LocalDate date, String level, long count) {}

    public record EventCount(String event, String level, String location, long count, Instant lastSeen) {}
}
