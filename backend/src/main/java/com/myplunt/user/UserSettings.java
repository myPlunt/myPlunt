package com.myplunt.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

// One row per user, but only once they've saved a setting: accounts without one get the
// defaults (everything on). Only the notification switches are mapped; post_visibility and
// achievement_notifications aren't used yet and keep their database defaults.
@Entity
@Table(name = "user_settings")
public class UserSettings {
    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "watering_reminders", nullable = false)
    private boolean wateringReminders = true;

    @Column(name = "weather_alerts", nullable = false)
    private boolean weatherAlerts = true;

    // Stories about friends' plants in the feed.
    @Column(name = "friend_post_notifications", nullable = false)
    private boolean friendPostNotifications = true;

    @Column(name = "friend_nudges", nullable = false)
    private boolean friendNudges = true;

    // A friend handing over, or taking back, care of plants (care_delegation).
    @Column(name = "delegation_requests", nullable = false)
    private boolean delegationRequests = true;

    protected UserSettings() {}

    public UserSettings(UUID userId) {
        this.userId = userId;
    }

    public UUID getUserId() {
        return userId;
    }

    public boolean isWateringReminders() {
        return wateringReminders;
    }

    public void setWateringReminders(boolean wateringReminders) {
        this.wateringReminders = wateringReminders;
    }

    public boolean isWeatherAlerts() {
        return weatherAlerts;
    }

    public void setWeatherAlerts(boolean weatherAlerts) {
        this.weatherAlerts = weatherAlerts;
    }

    public boolean isFriendPostNotifications() {
        return friendPostNotifications;
    }

    public void setFriendPostNotifications(boolean friendPostNotifications) {
        this.friendPostNotifications = friendPostNotifications;
    }

    public boolean isFriendNudges() {
        return friendNudges;
    }

    public void setFriendNudges(boolean friendNudges) {
        this.friendNudges = friendNudges;
    }

    public boolean isDelegationRequests() {
        return delegationRequests;
    }

    public void setDelegationRequests(boolean delegationRequests) {
        this.delegationRequests = delegationRequests;
    }
}
