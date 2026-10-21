package com.myplunt.notification;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.notification.dto.PushTokenRequest;
import com.myplunt.plant.LastWatering;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.plant.WateringLogRepository;
import com.myplunt.plant.WateringSchedule;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserSettings;
import com.myplunt.user.UserSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import java.time.DateTimeException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    // Reminders go out at 9:00 on each phone's own clock.
    static final int REMINDER_HOUR = 9;

    // App routes a tap opens (expo-router paths).
    static final String GARDEN_URL = "/garden";
    static final String FRIEND_REQUESTS_URL = "/friends?tab=requests";

    private final PushTokenRepository pushTokenRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PlantRepository plantRepository;
    private final WateringLogRepository wateringLogRepository;
    private final UserRepository userRepository;
    private final ExpoPushClient expoPushClient;

    public PushNotificationService(
            PushTokenRepository pushTokenRepository,
            UserSettingsRepository userSettingsRepository,
            PlantRepository plantRepository,
            WateringLogRepository wateringLogRepository,
            UserRepository userRepository,
            ExpoPushClient expoPushClient) {
        this.pushTokenRepository = pushTokenRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.plantRepository = plantRepository;
        this.wateringLogRepository = wateringLogRepository;
        this.userRepository = userRepository;
        this.expoPushClient = expoPushClient;
    }

    // A token already saved for another account moves to this one: the phone switched accounts.
    public void registerToken(UUID userId, PushTokenRequest request) {
        try {
            ZoneId.of(request.timeZone());
        } catch (DateTimeException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time zone is not valid.");
        }
        pushTokenRepository.save(new PushToken(request.token(), userId, request.timeZone()));
    }

    // Only the user's own token: removing someone else's would silence their phone.
    @Transactional
    public void removeToken(UUID userId, String token) {
        pushTokenRepository.deleteByTokenAndUserId(token, userId);
    }

    // Every hour, for the phones where it's now REMINDER_HOUR.
    // shortcut: loads every token each hour; query by zone once there are thousands of phones.
    @Scheduled(cron = "0 0 * * * *")
    public void sendWateringRemindersNow() {
        sendWateringReminders(Instant.now());
    }

    public void sendWateringReminders(Instant now) {
        List<ExpoPushMessage> messages = new ArrayList<>();
        for (PushToken pushToken : pushTokenRepository.findAll()) {
            ZoneId zone = ZoneId.of(pushToken.getTimeZone());
            if (now.atZone(zone).getHour() != REMINDER_HOUR || !wantsWateringReminders(pushToken.getUserId())) {
                continue;
            }
            List<String> names = plantsDueToday(pushToken.getUserId(), zone, now);
            if (!names.isEmpty()) {
                messages.add(new ExpoPushMessage(
                        pushToken.getToken(), reminderTitle(names), reminderText(names), GARDEN_URL));
            }
        }
        send(messages);
    }

    // To every phone of the receiver. Async, so a slow Expo never holds up sending the request.
    // There's no setting for it: a request is waiting on the user, and the phone's settings can still mute it.
    @Async
    public void sendFriendRequest(UUID requesterId, UUID receiverId) {
        List<PushToken> tokens = pushTokenRepository.findByUserId(receiverId);
        if (tokens.isEmpty()) {
            return;
        }
        String requester = userRepository.findById(requesterId).map(User::getUsername).orElse("Someone");
        send(tokens.stream()
                .map(pushToken -> new ExpoPushMessage(pushToken.getToken(), "New friend request 🌱",
                        requester + " wants to be friends.", FRIEND_REQUESTS_URL))
                .toList());
    }

    private void send(List<ExpoPushMessage> messages) {
        if (messages.isEmpty()) {
            return;
        }
        try {
            expoPushClient.send(messages);
        } catch (RestClientException e) {
            StructuredLog.error(log, LogEvent.PUSH_SEND_FAILED, e, Map.of("messages", messages.size()));
        }
    }

    // Accounts that never saved a setting get the defaults, which have reminders on.
    private boolean wantsWateringReminders(UUID userId) {
        return userSettingsRepository.findById(userId).map(UserSettings::isWateringReminders).orElse(true);
    }

    // Only plants due on today's date: overdue ones already had their reminder on the day.
    private List<String> plantsDueToday(UUID userId, ZoneId zone, Instant now) {
        List<Plant> plants = plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(userId);
        if (plants.isEmpty()) {
            return List.of();
        }
        Map<UUID, Instant> lastWatered = wateringLogRepository
                .findLastWateredAt(plants.stream().map(Plant::getId).toList()).stream()
                .collect(Collectors.toMap(LastWatering::plantId, LastWatering::wateredAt));
        LocalDate today = now.atZone(zone).toLocalDate();
        return plants.stream()
                .filter(plant -> WateringSchedule.nextWateringAt(plant, lastWatered.get(plant.getId()))
                        .atZone(zone).toLocalDate().equals(today))
                .map(Plant::getName)
                .toList();
    }

    static String reminderTitle(List<String> names) {
        return names.size() == 1
                ? names.get(0) + " is thirsty 💧"
                : names.size() + " plants are thirsty 💧";
    }

    // Names up to three plants; past that the rest are counted, so the text fits the banner.
    static String reminderText(List<String> names) {
        return switch (names.size()) {
            case 1 -> "Give " + names.get(0) + " some water today.";
            case 2 -> names.get(0) + " and " + names.get(1) + " need water today.";
            case 3 -> names.get(0) + ", " + names.get(1) + " and " + names.get(2) + " need water today.";
            default -> names.get(0) + ", " + names.get(1) + " and " + (names.size() - 2) + " more need water today.";
        };
    }
}
