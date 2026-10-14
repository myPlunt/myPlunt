package com.myplunt.plant;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class WateringConsistencyTest {

    private static final ZoneId AMSTERDAM = ZoneId.of("Europe/Amsterdam");

    // A local time in Amsterdam in October 2026.
    private static Instant october(int day, int hour) {
        return LocalDateTime.of(2026, 10, day, hour, 0).atZone(AMSTERDAM).toInstant();
    }

    private static Instant october(int day) {
        return october(day, 9);
    }

    // A plant on a 3-day schedule, added on 1 October.
    private static Plant vera() {
        Plant plant = new Plant(UUID.randomUUID(), "Vera");
        ReflectionTestUtils.setField(plant, "createdAt", october(1, 10));
        plant.setWateringEveryDays(3);
        return plant;
    }

    private static WateringConsistency of(Instant now, Instant... wateredAt) {
        return WateringConsistency.of(vera(), Arrays.asList(wateredAt), AMSTERDAM, now);
    }

    @Test
    void of_countsWateringsInARowOnOrBeforeTheirDueDayAsTheStreakEarlyOnesIncluded() {
        WateringConsistency result = of(october(14), october(4), october(6), october(9, 23), october(12));

        assertThat(result.daysLate()).containsExactly(0, 0, 0, 0);
        assertThat(result.currentStreak()).isEqualTo(4);
        assertThat(result.bestStreak()).isEqualTo(4);
        assertThat(result.onTimePercent()).isEqualTo(100);
    }

    @Test
    void of_breaksTheStreakOnALateWateringAndKeepsTheBest() {
        // The 16th is 3 days late (due the 13th).
        WateringConsistency result = of(october(20), october(4), october(7), october(10), october(16), october(18));

        assertThat(result.daysLate()).containsExactly(0, 0, 0, 3, 0);
        assertThat(result.currentStreak()).isEqualTo(1);
        assertThat(result.bestStreak()).isEqualTo(3);
        assertThat(result.onTimePercent()).isEqualTo(80);
    }

    @Test
    void of_dropsTheCurrentStreakTo0OnceThePlantIsOverdueButKeepsTheBest() {
        // Last watered on the 10th, so due on the 13th.
        WateringConsistency result = of(october(20), october(4), october(7), october(10));

        assertThat(result.overdue()).isTrue();
        assertThat(result.currentStreak()).isZero();
        assertThat(result.bestStreak()).isEqualTo(3);
    }

    @Test
    void of_isNotOverdueOnTheDueDayItself() {
        WateringConsistency result = of(october(10, 22), october(4), october(7));

        assertThat(result.overdue()).isFalse();
        assertThat(result.currentStreak()).isEqualTo(2);
    }

    @Test
    void of_countsCalendarDaysAcrossADaylightSavingChange() {
        // Amsterdam's clocks go back on 25 October, so the 24th to the 27th is 73 hours.
        assertThat(of(october(27), october(4), october(24), october(27)).daysLate()).containsExactly(0, 17, 0);
    }
}
