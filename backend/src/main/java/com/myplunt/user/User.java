package com.myplunt.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, columnDefinition = "citext")
    private String username;

    @Column(nullable = false, unique = true, columnDefinition = "citext")
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    private String bio;

    // Storage key of the profile picture; null when there is none.
    @Column(name = "avatar_key")
    private String avatarKey;

    // Where the user's plants are, for weather alerts; null until they share it.
    private String city;
    private Double latitude;
    private Double longitude;

    // Null until the user finishes or skips the app tour.
    @Column(name = "onboarding_completed_at")
    private Instant onboardingCompletedAt;

    // Which kinds of notifications the user wants; all on by default.
    @Column(name = "notify_water_reminders", nullable = false)
    private boolean notifyWaterReminders = true;

    @Column(name = "notify_weather_alerts", nullable = false)
    private boolean notifyWeatherAlerts = true;

    @Column(name = "notify_friend_activity", nullable = false)
    private boolean notifyFriendActivity = true;

    @Column(name = "notify_friend_nudges", nullable = false)
    private boolean notifyFriendNudges = true;

    @Column(name = "notify_plant_sitting", nullable = false)
    private boolean notifyPlantSitting = true;

    protected User() {}

    public User(String username, String email, String passwordHash) {
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
    }

    public UUID getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getAvatarKey() {
        return avatarKey;
    }

    public void setAvatarKey(String avatarKey) {
        this.avatarKey = avatarKey;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Instant getOnboardingCompletedAt() {
        return onboardingCompletedAt;
    }

    public void setOnboardingCompletedAt(Instant onboardingCompletedAt) {
        this.onboardingCompletedAt = onboardingCompletedAt;
    }

    public boolean isNotifyWaterReminders() {
        return notifyWaterReminders;
    }

    public void setNotifyWaterReminders(boolean notifyWaterReminders) {
        this.notifyWaterReminders = notifyWaterReminders;
    }

    public boolean isNotifyWeatherAlerts() {
        return notifyWeatherAlerts;
    }

    public void setNotifyWeatherAlerts(boolean notifyWeatherAlerts) {
        this.notifyWeatherAlerts = notifyWeatherAlerts;
    }

    public boolean isNotifyFriendActivity() {
        return notifyFriendActivity;
    }

    public void setNotifyFriendActivity(boolean notifyFriendActivity) {
        this.notifyFriendActivity = notifyFriendActivity;
    }

    public boolean isNotifyFriendNudges() {
        return notifyFriendNudges;
    }

    public void setNotifyFriendNudges(boolean notifyFriendNudges) {
        this.notifyFriendNudges = notifyFriendNudges;
    }

    public boolean isNotifyPlantSitting() {
        return notifyPlantSitting;
    }

    public void setNotifyPlantSitting(boolean notifyPlantSitting) {
        this.notifyPlantSitting = notifyPlantSitting;
    }
}
