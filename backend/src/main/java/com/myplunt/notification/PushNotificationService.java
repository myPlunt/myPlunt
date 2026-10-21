package com.myplunt.notification;

import com.myplunt.common.logging.LogEvent;
import com.myplunt.common.logging.StructuredLog;
import com.myplunt.notification.dto.NotificationResponse;
import com.myplunt.notification.dto.PushTokenRequest;
import com.myplunt.plant.LastWatering;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.plant.WateringLogRepository;
import com.myplunt.plant.WateringSchedule;
import com.myplunt.storage.StorageService;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserSettings;
import com.myplunt.user.UserSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
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

    // How many of the newest notifications the list shows.
    static final int INBOX_SIZE = 50;

    // Weather alert thresholds in °C over the next 24 hours.
    static final double FROST_BELOW = 3;
    static final double HEAT_ABOVE = 30;

    private final PushTokenRepository pushTokenRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PlantRepository plantRepository;
    private final WateringLogRepository wateringLogRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final StorageService storageService;
    private final ExpoPushClient expoPushClient;
    private final OpenWeatherClient openWeatherClient;

    public PushNotificationService(
            PushTokenRepository pushTokenRepository,
            UserSettingsRepository userSettingsRepository,
            PlantRepository plantRepository,
            WateringLogRepository wateringLogRepository,
            UserRepository userRepository,
            NotificationRepository notificationRepository,
            StorageService storageService,
            ExpoPushClient expoPushClient,
            OpenWeatherClient openWeatherClient) {
        this.pushTokenRepository = pushTokenRepository;
        this.userSettingsRepository = userSettingsRepository;
        this.plantRepository = plantRepository;
        this.wateringLogRepository = wateringLogRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.storageService = storageService;
        this.expoPushClient = expoPushClient;
        this.openWeatherClient = openWeatherClient;
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
        Instant now = Instant.now();
        sendWateringReminders(now);
        sendWeatherAlerts(now);
    }

    public void sendWateringReminders(Instant now) {
        List<ExpoPushMessage> messages = new ArrayList<>();
        // A user with two phones gets the reminder on both, but it's in their list once.
        Set<UUID> listed = new HashSet<>();
        for (PushToken pushToken : pushTokenRepository.findAll()) {
            ZoneId zone = ZoneId.of(pushToken.getTimeZone());
            if (now.atZone(zone).getHour() != REMINDER_HOUR || !wantsWateringReminders(pushToken.getUserId())) {
                continue;
            }
            List<String> names = plantsDueToday(pushToken.getUserId(), zone, now);
            if (!names.isEmpty()) {
                messages.add(new ExpoPushMessage(
                        pushToken.getToken(), reminderTitle(names), reminderText(names), GARDEN_URL));
                if (listed.add(pushToken.getUserId())) {
                    notificationRepository.save(new Notification(
                            pushToken.getUserId(), null, reminderTitle(names), reminderText(names), GARDEN_URL));
                }
            }
        }
        send(messages);
    }

    // Frost or heat in the next 24 hours where the user lives, sent with the morning reminders.
    // shortcut: no indoor/outdoor flag on plants, so every user with plants is warned; filter once plants have one.
    public void sendWeatherAlerts(Instant now) {
        if (!openWeatherClient.isEnabled()) {
            return;
        }
        List<ExpoPushMessage> messages = new ArrayList<>();
        Set<UUID> listed = new HashSet<>();
        // Users in the same town share one forecast call.
        Map<String, Optional<WeatherAlert>> alerts = new HashMap<>();
        for (PushToken pushToken : pushTokenRepository.findAll()) {
            UUID userId = pushToken.getUserId();
            if (now.atZone(ZoneId.of(pushToken.getTimeZone())).getHour() != REMINDER_HOUR
                    || !wantsWeatherAlerts(userId)
                    || plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(userId).isEmpty()) {
                continue;
            }
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || user.getLatitude() == null || user.getLongitude() == null) {
                continue;
            }
            double lat = OpenWeatherClient.round(user.getLatitude());
            double lon = OpenWeatherClient.round(user.getLongitude());
            Optional<WeatherAlert> alert = alerts.computeIfAbsent(lat + "," + lon, key -> weatherAlert(lat, lon));
            if (alert.isEmpty()) {
                continue;
            }
            messages.add(new ExpoPushMessage(pushToken.getToken(), alert.get().title(), alert.get().body(), GARDEN_URL));
            if (listed.add(userId)) {
                notificationRepository.save(new Notification(userId, null, alert.get().title(), alert.get().body(), GARDEN_URL));
            }
        }
        send(messages);
    }

    // A failed forecast skips that town today rather than the whole run.
    private Optional<WeatherAlert> weatherAlert(double lat, double lon) {
        try {
            return weatherAlert(openWeatherClient.next24Hours(lat, lon));
        } catch (RestClientException e) {
            StructuredLog.error(log, LogEvent.WEATHER_FETCH_FAILED, e, Map.of());
            return Optional.empty();
        }
    }

    record WeatherAlert(String title, String body) {}

    // Empty when the weather is fine. Frost wins: a cold plant can die overnight.
    static Optional<WeatherAlert> weatherAlert(OpenWeatherClient.Forecast forecast) {
        if (forecast.minTemp() < FROST_BELOW) {
            return Optional.of(new WeatherAlert("Frost is coming 🥶",
                    "It'll drop to " + Math.round(forecast.minTemp()) + "°C. Bring your outdoor plants inside."));
        }
        if (forecast.maxTemp() > HEAT_ABOVE) {
            return Optional.of(new WeatherAlert("Hot day ahead ☀️",
                    "It'll reach " + Math.round(forecast.maxTemp()) + "°C. Give your plants some extra water."));
        }
        return Optional.empty();
    }

    // To every phone of the receiver. Async, so a slow Expo never holds up sending the request.
    // There's no setting for it: a request is waiting on the user, and the phone's settings can still mute it.
    // It's listed even when the receiver has no phone with push, so they still see the request there.
    @Async
    public void sendFriendRequest(UUID requesterId, UUID receiverId) {
        String requester = userRepository.findById(requesterId).map(User::getUsername).orElse("Someone");
        String title = "New friend request 🌱";
        String body = requester + " wants to be friends.";
        notificationRepository.save(new Notification(receiverId, requesterId, title, body, FRIEND_REQUESTS_URL));
        send(pushTokenRepository.findByUserId(receiverId).stream()
                .map(pushToken -> new ExpoPushMessage(pushToken.getToken(), title, body, FRIEND_REQUESTS_URL))
                .toList());
    }

    // shortcut: no read/unread state and old rows are never deleted; add both if the list grows noisy.
    @Transactional(readOnly = true)
    public List<NotificationResponse> getInbox(UUID userId) {
        List<Notification> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Limit.of(INBOX_SIZE));
        // The senders' pictures in one query, not one per notification. Links are made per read, as they expire.
        Map<UUID, String> avatarUrls = new HashMap<>();
        userRepository.findAllById(notifications.stream().map(Notification::getFromUserId).filter(Objects::nonNull).toList())
                .forEach(user -> avatarUrls.put(user.getId(),
                        user.getAvatarKey() == null ? null : storageService.createReadUrl(user.getAvatarKey())));
        return notifications.stream()
                .map(n -> new NotificationResponse(n.getId(), n.getFromUserId(), avatarUrls.get(n.getFromUserId()),
                        n.getTitle(), n.getBody(), n.getUrl(), n.getCreatedAt()))
                .toList();
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

    private boolean wantsWeatherAlerts(UUID userId) {
        return userSettingsRepository.findById(userId).map(UserSettings::isWeatherAlerts).orElse(true);
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
