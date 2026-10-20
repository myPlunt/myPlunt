package com.myplunt.common.logging;

// What happened to an account or its data, as the "event" field of its audit line (written in
// snake_case: PLANT_CREATED -> "plant_created"). Outcomes only; the app logs what the user
// tried to do under its own names. Renaming a value splits its history in two.
public enum AuditEvent {
    USER_REGISTERED,
    // reason: email_in_use or username_taken.
    REGISTRATION_REJECTED,
    LOGIN_SUCCEEDED,
    // reason: unknown_email or wrong_password.
    LOGIN_FAILED,
    LOGGED_OUT,
    SESSION_REFRESHED,
    // reason: unknown_token or expired.
    SESSION_REFRESH_REJECTED,
    PROFILE_UPDATED,
    EMAIL_CHANGED,
    // reason: wrong_password or email_in_use.
    EMAIL_CHANGE_REJECTED,
    AVATAR_UPDATED,
    AVATAR_REMOVED,
    LOCATION_UPDATED,
    FRIEND_REQUEST_SENT,
    FRIEND_REQUEST_ACCEPTED,
    FRIEND_REQUEST_DECLINED,
    FRIEND_REQUEST_CANCELLED,
    FRIEND_REMOVED,
    PLANTER_CREATED,
    PLANTER_RENAMED,
    PLANTER_DELETED,
    PLANT_CREATED,
    PLANT_UPDATED,
    PLANT_DELETED,
    PLANT_PHOTO_ADDED,
    PLANT_PHOTO_UPDATED,
    PLANT_PHOTO_DELETED,
    PLANT_WATERED,
    QUESTION_ASKED,
    POST_UPDATED,
    POST_DELETED,
    // Not something the user did: the late watering that ended a streak.
    WATERING_STREAK_BROKEN,
    // reason: too_large. The upload was deleted from storage.
    PHOTO_UPLOAD_REJECTED,
    // The only actions from the admin dashboard that are logged: changed_by is the admin's id
    // (admin_users), user_id the account that submitted the species.
    SPECIES_APPROVED,
    SPECIES_REJECTED,
    DATABASE_RESET,
    // reason: wrong_secret.
    DATABASE_RESET_REJECTED
}
