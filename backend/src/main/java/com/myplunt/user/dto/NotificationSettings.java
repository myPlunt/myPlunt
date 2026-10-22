package com.myplunt.user.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationSettings(
        @NotNull(message = "Water reminders must not be blank.") Boolean waterReminders,
        @NotNull(message = "Weather alerts must not be blank.") Boolean weatherAlerts,
        @NotNull(message = "Friend activity must not be blank.") Boolean friendActivity,
        @NotNull(message = "Friend nudges must not be blank.") Boolean friendNudges,
        @NotNull(message = "Likes and comments must not be blank.") Boolean postInteractions,
        @NotNull(message = "Plant sitting must not be blank.") Boolean plantSitting) {}
