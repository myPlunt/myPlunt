package com.myplunt.common.logging;

// The "action" field of each action line in the log file, which the admin dashboard groups
// by. Renaming a value splits its history in two.
public enum UserAction {
    USER_REGISTERED,
    USER_LOGGED_IN,
    PLANT_CREATED,
    PLANT_DELETED,
    // streak: the plant's watering streak after this watering.
    PLANT_WATERED,
    // lostStreak: how long the streak was. Logged on the late watering that ends it, since
    // that's the first moment the backend sees the plant was overdue.
    WATERING_STREAK_BROKEN
}
