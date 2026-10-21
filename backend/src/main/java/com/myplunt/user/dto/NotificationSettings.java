package com.myplunt.user.dto;

import jakarta.validation.constraints.NotNull;

// Which kinds of notifications the user wants. Sent whole on PUT, so every field is required.
// friendActivity: stories about friends' plants. friendNudges: a friend reminding the user to water.
// plantSitting: a friend handing over, or taking back, care of plants.
public record NotificationSettings(
        @NotNull(message = "Water reminders must not be blank.") Boolean waterReminders,
        @NotNull(message = "Weather alerts must not be blank.") Boolean weatherAlerts,
        @NotNull(message = "Friend activity must not be blank.") Boolean friendActivity,
        @NotNull(message = "Friend nudges must not be blank.") Boolean friendNudges,
        @NotNull(message = "Plant sitting must not be blank.") Boolean plantSitting) {}
