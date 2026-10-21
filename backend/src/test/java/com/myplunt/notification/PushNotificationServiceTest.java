package com.myplunt.notification;

import com.myplunt.notification.dto.PushTokenRequest;
import com.myplunt.plant.LastWatering;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.plant.WateringLogRepository;
import com.myplunt.user.UserSettings;
import com.myplunt.user.UserSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTest {

    // 9:00 in Amsterdam (CEST, UTC+2).
    private static final Instant NINE_IN_AMSTERDAM = Instant.parse("2026-10-21T07:00:00Z");
    private static final UUID USER_ID = UUID.randomUUID();

    @Mock
    private PushTokenRepository pushTokenRepository;
    @Mock
    private UserSettingsRepository userSettingsRepository;
    @Mock
    private PlantRepository plantRepository;
    @Mock
    private WateringLogRepository wateringLogRepository;
    @Mock
    private ExpoPushClient expoPushClient;

    private PushNotificationService service() {
        return new PushNotificationService(
                pushTokenRepository, userSettingsRepository, plantRepository, wateringLogRepository, expoPushClient);
    }

    // On a 3-day schedule (the owner's own).
    private Plant plant(String name) {
        Plant plant = new Plant(USER_ID, name);
        ReflectionTestUtils.setField(plant, "id", UUID.randomUUID());
        ReflectionTestUtils.setField(plant, "createdAt", NINE_IN_AMSTERDAM.minus(Duration.ofDays(30)));
        plant.setWateringEveryDays(3);
        return plant;
    }

    private LastWatering watered(Plant plant, int daysAgo) {
        return new LastWatering(plant.getId(), NINE_IN_AMSTERDAM.minus(Duration.ofDays(daysAgo)));
    }

    @Test
    void sendWateringReminders_remindsOnlyAboutPlantsDueToday() {
        Plant dueToday = plant("Monty");
        Plant overdue = plant("Fern");
        Plant dueTomorrow = plant("Cactus");
        when(pushTokenRepository.findAll())
                .thenReturn(List.of(new PushToken("ExponentPushToken[a]", USER_ID, "Europe/Amsterdam")));
        when(userSettingsRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(USER_ID))
                .thenReturn(List.of(dueToday, overdue, dueTomorrow));
        when(wateringLogRepository.findLastWateredAt(anyList()))
                .thenReturn(List.of(watered(dueToday, 3), watered(overdue, 5), watered(dueTomorrow, 2)));

        service().sendWateringReminders(NINE_IN_AMSTERDAM);

        verify(expoPushClient).send(List.of(
                new ExpoPushMessage("ExponentPushToken[a]", "Time to water", "Monty needs water today.")));
    }

    @Test
    void sendWateringReminders_skipsPhonesWhereItIsNotNineAndUsersWhoTurnedRemindersOff() {
        UUID otherUser = UUID.randomUUID();
        UserSettings off = new UserSettings(USER_ID);
        off.setWateringReminders(false);
        when(pushTokenRepository.findAll()).thenReturn(List.of(
                new PushToken("ExponentPushToken[a]", USER_ID, "Europe/Amsterdam"),
                // 8:00 in London at the same moment.
                new PushToken("ExponentPushToken[b]", otherUser, "Europe/London")));
        when(userSettingsRepository.findById(USER_ID)).thenReturn(Optional.of(off));

        service().sendWateringReminders(NINE_IN_AMSTERDAM);

        verify(plantRepository, never()).findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(any());
        verify(expoPushClient, never()).send(anyList());
    }

    @Test
    void registerToken_rejectsAnUnknownTimeZone() {
        assertThatThrownBy(() -> service().registerToken(USER_ID, new PushTokenRequest("ExponentPushToken[a]", "Mars/Olympus")))
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(pushTokenRepository, never()).save(any());
    }

    @Test
    void reminderText_namesTwoPlantsAndCountsTheRest() {
        assertThat(PushNotificationService.reminderText(List.of("Monty", "Fern", "Cactus", "Ivy")))
                .isEqualTo("Monty, Fern and 2 more need water today.");
    }
}
