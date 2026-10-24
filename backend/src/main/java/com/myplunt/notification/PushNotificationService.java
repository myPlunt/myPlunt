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
import com.myplunt.post.Post;
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
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    // Reminders go out at 9:00 on each phone's own clock.
    static final int REMINDER_HOUR = 9;

    // App routes a tap opens (expo-router paths).
    static final String GARDEN_URL = "/garden";
    static final String FRIEND_REQUESTS_URL = "/friends?tab=requests";
    static final String POST_URL = "/post/";
    static final String PLANT_SITTER_URL = "/plant-sitter";

    // A comment or question is quoted only this far, so it fits the banner (and notifications.body).
    static final int QUOTE_LENGTH = 100;

    static final int INBOX_SIZE = 50;

    // Weather alert thresholds in °C over the next 24 hours.
    static final double FROST_BELOW = 3;
    static final double HEAT_ABOVE = 30;
    // Enough rain in 24 hours to stand in for a watering.
    static final double RAIN_FROM_MM = 5;

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

    // shortcut: no indoor/outdoor flag on plants, so every user with plants is warned; filter once plants have one.
    public void sendWeatherAlerts(Instant now) {
        sendWeatherAlerts(zone -> now.atZone(zone).getHour() == REMINDER_HOUR, false);
    }

    // A staging dashboard job: tries the whole chain on a phone, even on a mild day.
    public void sendWeatherAlertsToEveryone() {
        sendWeatherAlerts(zone -> true, true);
    }

    private void sendWeatherAlerts(Predicate<ZoneId> isTime, boolean evenWhenMild) {
        if (!openWeatherClient.isEnabled()) {
            return;
        }
        List<ExpoPushMessage> messages = new ArrayList<>();
        Set<UUID> listed = new HashSet<>();
        // Users in the same town share one forecast call.
        Map<String, Optional<WeatherAlert>> alerts = new HashMap<>();
        for (PushToken pushToken : pushTokenRepository.findAll()) {
            UUID userId = pushToken.getUserId();
            if (!isTime.test(ZoneId.of(pushToken.getTimeZone()))
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
            Optional<WeatherAlert> alert = alerts.computeIfAbsent(lat + "," + lon, key -> weatherAlert(lat, lon, evenWhenMild));
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
    private Optional<WeatherAlert> weatherAlert(double lat, double lon, boolean evenWhenMild) {
        try {
            OpenWeatherClient.Forecast forecast = openWeatherClient.next24Hours(lat, lon);
            return weatherAlert(forecast).or(() -> evenWhenMild
                    ? Optional.of(new WeatherAlert("Weather check 🌤️", "Between " + Math.round(forecast.minTemp())
                            + " and " + Math.round(forecast.maxTemp()) + "°C today. Your plants should be fine."))
                    : Optional.empty());
        } catch (RestClientException e) {
            StructuredLog.error(log, LogEvent.WEATHER_FETCH_FAILED, e, Map.of());
            return Optional.empty();
        }
    }

    record WeatherAlert(String title, String body) {}

    // Frost wins over heat, and both over rain: a cold or scorched plant can die, a missed watering can't.
    static Optional<WeatherAlert> weatherAlert(OpenWeatherClient.Forecast forecast) {
        if (forecast.minTemp() < FROST_BELOW) {
            return Optional.of(new WeatherAlert("Frost is coming 🥶",
                    "It'll drop to " + Math.round(forecast.minTemp()) + "°C. Bring your outdoor plants inside."));
        }
        if (forecast.maxTemp() > HEAT_ABOVE) {
            return Optional.of(new WeatherAlert("Hot day ahead ☀️",
                    "It'll reach " + Math.round(forecast.maxTemp()) + "°C. Give your plants some extra water."));
        }
        if (forecast.rainMm() >= RAIN_FROM_MM) {
            return Optional.of(new WeatherAlert("Rain today 🌧️",
                    "About " + Math.round(forecast.rainMm()) + " mm of rain is coming. Your outdoor plants can skip watering."));
        }
        return Optional.empty();
    }

    // No setting turns this off: a request waits on the user, and the phone can still mute it.
    @Async
    public void sendFriendRequest(UUID requesterId, UUID receiverId) {
        notify(receiverId, requesterId, "New friend request 🌱", username(requesterId) + " wants to be friends.",
                FRIEND_REQUESTS_URL);
    }

    @Async
    public void sendCareRequest(UUID requesterId, UUID sitterId, long days) {
        if (!wantsPlantSitting(sitterId)) {
            return;
        }
        notify(sitterId, requesterId, "Plant sitter request 🪴",
                username(requesterId) + " asked you to look after their plants for " + days + (days == 1 ? " day." : " days."),
                PLANT_SITTER_URL);
    }

    @Async
    public void sendCareAnswer(UUID sitterId, UUID requesterId, boolean accepted) {
        if (!wantsPlantSitting(requesterId)) {
            return;
        }
        String who = username(sitterId);
        notify(requesterId, sitterId, accepted ? "Plant sitter found 🪴" : "Plant sitter request declined",
                accepted ? who + " will look after your plants while you're away." : who + " can't look after your plants this time.",
                PLANT_SITTER_URL);
    }

    @Async
    public void sendCareWithdrawn(UUID sitterId, UUID requesterId) {
        if (!wantsPlantSitting(requesterId)) {
            return;
        }
        notify(requesterId, sitterId, "Plant sitter cancelled",
                username(sitterId) + " can't look after your plants anymore.", PLANT_SITTER_URL);
    }

    @Async
    public void sendCareCancelled(UUID requesterId, UUID sitterId) {
        if (!wantsPlantSitting(sitterId)) {
            return;
        }
        notify(sitterId, requesterId, "Plant sitter request cancelled",
                username(requesterId) + " doesn't need a plant sitter anymore.", PLANT_SITTER_URL);
    }

    @Async
    public void sendPostComment(UUID commenterId, PostNotice post, String comment) {
        if (!wantsPostInteractions(post.ownerId())) {
            return;
        }
        String who = username(commenterId);
        boolean isQuestion = Post.QUESTION.equals(post.type());
        notify(post.ownerId(), commenterId,
                isQuestion ? "New answer 💬" : "New comment 💬",
                (isQuestion ? who + " answered your question: " : who + " commented on " + post.plantName() + ": ")
                        + quote(comment),
                POST_URL + post.postId());
    }

    // Skips the post's author: sendPostComment tells them, so nobody hears about one comment twice.
    @Async
    public void sendCommentReply(UUID commenterId, PostNotice post, String comment, List<UUID> earlierCommenters) {
        boolean isQuestion = Post.QUESTION.equals(post.type());
        String whose = commenterId.equals(post.ownerId())
                ? isQuestion ? "their " : ""
                : username(post.ownerId()) + "'s ";
        String body = username(commenterId) + " replied on " + whose + (isQuestion ? "question" : post.plantName())
                + ": " + quote(comment);
        for (UUID userId : earlierCommenters) {
            if (!userId.equals(commenterId) && !userId.equals(post.ownerId()) && wantsPostInteractions(userId)) {
                notify(userId, commenterId, "New reply 💬", body, POST_URL + post.postId());
            }
        }
    }

    // shortcut: watering, taking it back and watering again notifies twice; collapse repeats if friends complain.
    @Async
    public void sendPostWatered(UUID fromId, PostNotice post) {
        if (!wantsPostInteractions(post.ownerId())) {
            return;
        }
        String what = switch (post.type()) {
            case Post.QUESTION -> "your question " + quote(post.question());
            case Post.NEW_PHOTO -> "your photo of " + post.plantName() + ".";
            default -> "your new plant " + post.plantName() + ".";
        };
        notify(post.ownerId(), fromId, "New like 💧", username(fromId) + " liked " + what, POST_URL + post.postId());
    }

    static String quote(String text) {
        return "\"" + (text.length() > QUOTE_LENGTH ? text.substring(0, QUOTE_LENGTH).strip() + "…" : text) + "\"";
    }

    private void notify(UUID userId, UUID fromUserId, String title, String body, String url) {
        notificationRepository.save(new Notification(userId, fromUserId, title, body, url));
        send(pushTokenRepository.findByUserId(userId).stream()
                .map(pushToken -> new ExpoPushMessage(pushToken.getToken(), title, body, url))
                .toList());
    }

    private String username(UUID userId) {
        return userRepository.findById(userId).map(User::getUsername).orElse("Someone");
    }

    // shortcut: no read/unread state and old rows are never deleted; add both if the list grows noisy.
    @Transactional(readOnly = true)
    public List<NotificationResponse> getInbox(UUID userId) {
        List<Notification> notifications =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, Limit.of(INBOX_SIZE));
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

    private boolean wantsWateringReminders(UUID userId) {
        return userSettingsRepository.findById(userId).map(UserSettings::isWateringReminders).orElse(true);
    }

    private boolean wantsWeatherAlerts(UUID userId) {
        return userSettingsRepository.findById(userId).map(UserSettings::isWeatherAlerts).orElse(true);
    }

    private boolean wantsPlantSitting(UUID userId) {
        return userSettingsRepository.findById(userId).map(UserSettings::isDelegationRequests).orElse(true);
    }

    private boolean wantsPostInteractions(UUID userId) {
        return userSettingsRepository.findById(userId).map(UserSettings::isPostInteractions).orElse(true);
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

    static String reminderText(List<String> names) {
        return switch (names.size()) {
            case 1 -> "Give " + names.get(0) + " some water today.";
            case 2 -> names.get(0) + " and " + names.get(1) + " need water today.";
            case 3 -> names.get(0) + ", " + names.get(1) + " and " + names.get(2) + " need water today.";
            default -> names.get(0) + ", " + names.get(1) + " and " + (names.size() - 2) + " more need water today.";
        };
    }
}
