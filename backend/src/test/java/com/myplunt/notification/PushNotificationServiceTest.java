package com.myplunt.notification;

import com.myplunt.notification.dto.NotificationResponse;
import com.myplunt.notification.dto.PushTokenRequest;
import com.myplunt.plant.LastWatering;
import com.myplunt.plant.Plant;
import com.myplunt.plant.PlantRepository;
import com.myplunt.plant.WateringLogRepository;
import com.myplunt.post.Post;
import com.myplunt.storage.StorageService;
import com.myplunt.user.User;
import com.myplunt.user.UserRepository;
import com.myplunt.user.UserSettings;
import com.myplunt.user.UserSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
    private UserRepository userRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private StorageService storageService;
    @Mock
    private ExpoPushClient expoPushClient;
    @Mock
    private OpenWeatherClient openWeatherClient;

    private PushNotificationService service() {
        return new PushNotificationService(
                pushTokenRepository, userSettingsRepository, plantRepository, wateringLogRepository, userRepository, notificationRepository, storageService, expoPushClient, openWeatherClient);
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

    // Two phones get the reminder, but it's listed once.
    @Test
    void sendWateringReminders_remindsOnlyAboutPlantsDueToday() {
        Plant dueToday = plant("Monty");
        Plant overdue = plant("Fern");
        Plant dueTomorrow = plant("Cactus");
        when(pushTokenRepository.findAll())
                .thenReturn(List.of(
                        new PushToken("ExponentPushToken[a]", USER_ID, "Europe/Amsterdam"),
                        new PushToken("ExponentPushToken[b]", USER_ID, "Europe/Amsterdam")));
        when(userSettingsRepository.findById(USER_ID)).thenReturn(Optional.empty());
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(USER_ID))
                .thenReturn(List.of(dueToday, overdue, dueTomorrow));
        when(wateringLogRepository.findLastWateredAt(anyList()))
                .thenReturn(List.of(watered(dueToday, 3), watered(overdue, 5), watered(dueTomorrow, 2)));

        service().sendWateringReminders(NINE_IN_AMSTERDAM);

        verify(expoPushClient).send(List.of(
                new ExpoPushMessage("ExponentPushToken[a]", "Monty is thirsty 💧", "Give Monty some water today.", "/garden"),
                new ExpoPushMessage("ExponentPushToken[b]", "Monty is thirsty 💧", "Give Monty some water today.", "/garden")));
        verify(notificationRepository).save(any(Notification.class));
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

    // Two neighbours a few metres apart round to the same spot, so their town is fetched once.
    @Test
    void sendWeatherAlerts_warnsAboutFrostWithOneForecastPerTown() {
        UUID neighbour = UUID.randomUUID();
        User user = new User("ana", "ana@example.com", "hashed");
        user.setLatitude(52.2214);
        user.setLongitude(6.8937);
        User other = new User("bo", "bo@example.com", "hashed");
        other.setLatitude(52.2186);
        other.setLongitude(6.8949);
        when(openWeatherClient.isEnabled()).thenReturn(true);
        when(pushTokenRepository.findAll()).thenReturn(List.of(
                new PushToken("ExponentPushToken[a]", USER_ID, "Europe/Amsterdam"),
                new PushToken("ExponentPushToken[b]", neighbour, "Europe/Amsterdam")));
        when(userSettingsRepository.findById(any())).thenReturn(Optional.empty());
        when(plantRepository.findByOwnerIdAndAliveTrueOrderByCreatedAtAsc(any())).thenReturn(List.of(plant("Monty")));
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userRepository.findById(neighbour)).thenReturn(Optional.of(other));
        when(openWeatherClient.next24Hours(52.22, 6.89)).thenReturn(new OpenWeatherClient.Forecast(-1.4, 6));

        service().sendWeatherAlerts(NINE_IN_AMSTERDAM);

        verify(openWeatherClient).next24Hours(52.22, 6.89);
        String body = "It'll drop to -1°C. Bring your outdoor plants inside.";
        verify(expoPushClient).send(List.of(
                new ExpoPushMessage("ExponentPushToken[a]", "Frost is coming 🥶", body, "/garden"),
                new ExpoPushMessage("ExponentPushToken[b]", "Frost is coming 🥶", body, "/garden")));
    }

    @Test
    void weatherAlert_staysQuietOnAMildDayAndWarnsAboutHeat() {
        assertThat(PushNotificationService.weatherAlert(new OpenWeatherClient.Forecast(8, 22))).isEmpty();
        assertThat(PushNotificationService.weatherAlert(new OpenWeatherClient.Forecast(18, 33)))
                .contains(new PushNotificationService.WeatherAlert(
                        "Hot day ahead ☀️", "It'll reach 33°C. Give your plants some extra water."));
    }

    @Test
    void sendFriendRequest_tellsEveryPhoneOfTheReceiverWhoAskedAndOpensTheirRequests() {
        UUID janeId = UUID.randomUUID();
        when(pushTokenRepository.findByUserId(USER_ID)).thenReturn(List.of(
                new PushToken("ExponentPushToken[phone]", USER_ID, "Europe/Amsterdam"),
                new PushToken("ExponentPushToken[tablet]", USER_ID, "Europe/Amsterdam")));
        when(userRepository.findById(janeId)).thenReturn(Optional.of(new User("jane", "jane@example.com", "hashed")));

        service().sendFriendRequest(janeId, USER_ID);

        verify(expoPushClient).send(List.of(
                new ExpoPushMessage("ExponentPushToken[phone]", "New friend request 🌱", "jane wants to be friends.", "/friends?tab=requests"),
                new ExpoPushMessage("ExponentPushToken[tablet]", "New friend request 🌱", "jane wants to be friends.", "/friends?tab=requests")));
        verify(notificationRepository).save(any(Notification.class));
    }

    // Without a phone there's nothing to push, but the request still shows up in their list.
    @Test
    void sendFriendRequest_listsTheRequestForAReceiverWithoutPush() {
        UUID janeId = UUID.randomUUID();
        when(userRepository.findById(janeId)).thenReturn(Optional.of(new User("jane", "jane@example.com", "hashed")));
        when(pushTokenRepository.findByUserId(USER_ID)).thenReturn(List.of());

        service().sendFriendRequest(janeId, USER_ID);

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getValue().getFromUserId()).isEqualTo(janeId);
        assertThat(saved.getValue().getBody()).isEqualTo("jane wants to be friends.");
        assertThat(saved.getValue().getUrl()).isEqualTo("/friends?tab=requests");
        verify(expoPushClient, never()).send(anyList());
    }

    // A comment on a question is an answer to it.
    @Test
    void sendPostComment_tellsTheAuthorTheirQuestionWasAnsweredAndOpensIt() {
        UUID janeId = UUID.randomUUID();
        UUID postId = UUID.randomUUID();
        when(userRepository.findById(janeId)).thenReturn(Optional.of(new User("jane", "jane@example.com", "hashed")));
        when(pushTokenRepository.findByUserId(USER_ID))
                .thenReturn(List.of(new PushToken("ExponentPushToken[phone]", USER_ID, "Europe/Amsterdam")));

        service().sendPostComment(janeId, new PostNotice(postId, USER_ID, Post.QUESTION, null, "Why?"), "Too much sun");

        verify(expoPushClient).send(List.of(new ExpoPushMessage("ExponentPushToken[phone]", "New answer 💬",
                "jane answered your question: \"Too much sun\"", "/post/" + postId)));
        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getValue().getFromUserId()).isEqualTo(janeId);
    }

    // The author answering under their own post reaches the friend who commented, not themselves.
    @Test
    void sendCommentReply_tellsEarlierCommentersButNotTheCommenter() {
        UUID janeId = UUID.randomUUID();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(new User("emma", "emma@example.com", "hashed")));

        service().sendCommentReply(USER_ID, new PostNotice(UUID.randomUUID(), USER_ID, Post.NEW_PLANT, "Gus", null),
                "Thanks!", List.of(janeId, USER_ID));

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(janeId);
        assertThat(saved.getValue().getTitle()).isEqualTo("New reply 💬");
        assertThat(saved.getValue().getBody()).isEqualTo("emma replied on Gus: \"Thanks!\"");
    }

    @Test
    void sendPostWatered_saysWhichPhotoWasLiked() {
        UUID janeId = UUID.randomUUID();
        when(userRepository.findById(janeId)).thenReturn(Optional.of(new User("jane", "jane@example.com", "hashed")));

        service().sendPostWatered(janeId, new PostNotice(UUID.randomUUID(), USER_ID, Post.NEW_PHOTO, "Gus the Fern", null));

        ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(saved.capture());
        assertThat(saved.getValue().getTitle()).isEqualTo("New like 💧");
        assertThat(saved.getValue().getBody()).isEqualTo("jane liked your photo of Gus the Fern.");
    }

    // "Likes & comments" off: nothing is pushed or listed.
    @Test
    void sendPostWatered_staysQuietWhenTheAuthorTurnedLikesAndCommentsOff() {
        UserSettings settings = new UserSettings(USER_ID);
        settings.setPostInteractions(false);
        when(userSettingsRepository.findById(USER_ID)).thenReturn(Optional.of(settings));

        service().sendPostWatered(UUID.randomUUID(), new PostNotice(UUID.randomUUID(), USER_ID, Post.NEW_PLANT, "Gus", null));

        verify(notificationRepository, never()).save(any());
        verify(expoPushClient, never()).send(anyList());
    }

    // A friend request shows who sent it; a reminder is from the app, so it has no sender.
    @Test
    void getInbox_addsTheSendersPictureToTheirNotifications() {
        User jane = new User("jane", "jane@example.com", "hashed");
        UUID janeId = UUID.randomUUID();
        ReflectionTestUtils.setField(jane, "id", janeId);
        jane.setAvatarKey("avatars/jane.jpg");
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(any(), any())).thenReturn(List.of(
                new Notification(USER_ID, janeId, "New friend request 🌱", "jane wants to be friends.", "/friends?tab=requests"),
                new Notification(USER_ID, null, "Monty is thirsty 💧", "Give Monty some water today.", "/garden")));
        when(userRepository.findAllById(List.of(janeId))).thenReturn(List.of(jane));
        when(storageService.createReadUrl("avatars/jane.jpg")).thenReturn("https://storage.test/jane.jpg");

        List<NotificationResponse> inbox = service().getInbox(USER_ID);

        assertThat(inbox).extracting(NotificationResponse::fromUserId).containsExactly(janeId, null);
        assertThat(inbox).extracting(NotificationResponse::fromAvatarUrl).containsExactly("https://storage.test/jane.jpg", null);
    }

    @Test
    void registerToken_rejectsAnUnknownTimeZone() {
        assertThatThrownBy(() -> service().registerToken(USER_ID, new PushTokenRequest("ExponentPushToken[a]", "Mars/Olympus")))
                .extracting("statusCode")
                .isEqualTo(HttpStatus.BAD_REQUEST);
        verify(pushTokenRepository, never()).save(any());
    }

    @Test
    void reminder_countsThePlantsInTheTitleAndNamesUpToThreeInTheText() {
        assertThat(PushNotificationService.reminderTitle(List.of("Monty", "Fern", "Cactus")))
                .isEqualTo("3 plants are thirsty 💧");
        assertThat(PushNotificationService.reminderText(List.of("Monty", "Fern", "Cactus")))
                .isEqualTo("Monty, Fern and Cactus need water today.");
        assertThat(PushNotificationService.reminderText(List.of("Monty", "Fern", "Cactus", "Ivy")))
                .isEqualTo("Monty, Fern and 2 more need water today.");
    }
}
