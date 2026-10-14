package com.myplunt.plant.dto;

// The user's watering streak: the current streaks of all their living plants added up (see
// WateringConsistency), so it matches the numbers on the garden's plant cards.
public record WateringStreakResponse(int wateringStreak) {
}
