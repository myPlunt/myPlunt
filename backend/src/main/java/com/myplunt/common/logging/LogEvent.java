package com.myplunt.common.logging;

// The "event" field of the backend's warnings, errors and bugs (snake_case, like AuditEvent).
public enum LogEvent {
    // Warnings: a request was turned away, or something went wrong that the backend recovered from.
    REQUEST_VALIDATION_FAILED,
    REQUEST_UNREADABLE,
    REQUEST_REJECTED,
    RESOURCE_NOT_FOUND,
    UNAUTHENTICATED_REQUEST,
    INVALID_TOKEN,
    PHOTO_CLEANUP_FAILED,
    SEED_IMAGE_UNAVAILABLE,
    SEED_IMAGE_PLACEHOLDER_USED,
    // Errors: the operation could not complete.
    UNHANDLED_EXCEPTION,
    PUSH_SEND_FAILED,
    // Bugs: states the code should make impossible.
    PLANT_IN_UNKNOWN_PLANTER
}
