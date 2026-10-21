import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { AppState, Platform } from 'react-native';

import { ApiError, apiFetch } from '@/lib/auth/api-client';

// What the user tried to do and what they saw, stored by the backend in its logs table. Event names
// describe intent or UI state ("_submitted", "_failed_ui"), never an outcome: only the backend
// knows whether a change was saved, and logs it under its own names.
export type FrontendEvent =
  // actions
  | 'screen_viewed'
  | 'login_submitted'
  | 'registration_submitted'
  | 'logout_submitted'
  | 'plant_create_submitted'
  | 'plant_update_submitted'
  | 'plant_delete_started'
  | 'plant_delete_cancelled'
  | 'plant_delete_submitted'
  | 'plant_photo_add_submitted'
  | 'plant_photo_update_submitted'
  | 'plant_photo_delete_started'
  | 'plant_photo_delete_cancelled'
  | 'plant_photo_delete_submitted'
  | 'watering_submitted'
  | 'planter_create_submitted'
  | 'planter_rename_submitted'
  | 'planter_delete_started'
  | 'planter_delete_cancelled'
  | 'planter_delete_submitted'
  | 'profile_update_submitted'
  | 'email_change_submitted'
  | 'avatar_update_submitted'
  | 'avatar_remove_submitted'
  | 'location_share_submitted'
  | 'onboarding_complete_submitted'
  | 'notification_settings_update_submitted'
  | 'friend_request_submitted'
  | 'friend_remove_submitted'
  | 'question_ask_submitted'
  | 'post_opened'
  | 'post_update_submitted'
  | 'post_delete_started'
  | 'post_delete_cancelled'
  | 'post_delete_submitted'
  | 'photo_upload_submitted'
  | 'photo_picker_cancelled'
  // warnings
  | 'api_request_rejected'
  | 'slow_api_response'
  | 'request_retried_after_refresh'
  | 'session_expired'
  | 'form_validation_failed'
  | 'camera_permission_denied'
  | 'location_permission_denied'
  | 'login_failed_ui'
  | 'registration_failed_ui'
  | 'plant_save_failed_ui'
  | 'plant_delete_failed_ui'
  | 'plant_photo_add_failed_ui'
  | 'plant_photo_update_failed_ui'
  | 'plant_photo_delete_failed_ui'
  | 'watering_failed_ui'
  | 'planter_create_failed_ui'
  | 'planter_rename_failed_ui'
  | 'planter_delete_failed_ui'
  | 'profile_update_failed_ui'
  | 'email_change_failed_ui'
  | 'avatar_remove_failed_ui'
  | 'location_share_failed_ui'
  | 'notification_settings_update_failed_ui'
  | 'question_ask_failed_ui'
  | 'post_update_failed_ui'
  | 'post_delete_failed_ui'
  | 'friend_request_failed_ui'
  | 'friend_remove_failed_ui'
  | 'photo_upload_failed_ui'
  // errors
  | 'api_request_failed'
  | 'photo_upload_failed'
  | 'recent_photos_load_failed'
  | 'watering_streak_load_failed'
  | 'app_crashed'
  | 'uncaught_error'
  // bugs
  | 'unexpected_api_response';

type LogType = 'error' | 'warning' | 'action' | 'bug' | 'info';

/** Ids, statuses, field names: never personal data (emails, names, what the user typed). */
export type LogContext = Record<string, string | number | boolean | null | undefined>;

interface LogOptions {
  /** The X-Request-ID of the request this line is about, so it can be matched with the backend's. */
  requestId?: string;
  context?: LogContext;
}

interface LogEntry {
  timestamp: string;
  type: LogType;
  event: FrontendEvent;
  requestId?: string;
  route?: string;
  message?: string;
  context?: Record<string, string>;
  stackTrace?: string;
}

// The backend's limits for POST /v1/client-logs (ClientLogBatch, ClientLogEntry).
const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LENGTH = 8000;
const MAX_CONTEXT_VALUE_LENGTH = 500;
const BATCH_SIZE = 50;
// Lines wait this long for others to share a request with.
const FLUSH_DELAY_MS = 10_000;
// While the lines can't be sent (offline, signed out), the oldest go first past this.
const MAX_QUEUED = 500;

const queue: LogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let sending: Promise<void> = Promise.resolve();
let currentRoute: string | undefined;

export function logAction(event: FrontendEvent, options: LogOptions = {}) {
  enqueue('action', event, options);
}

export function logWarning(event: FrontendEvent, options: LogOptions = {}) {
  printInDev(event, options);
  enqueue('warning', event, options);
}

// Sent right away: the app may be about to close.
export function logError(event: FrontendEvent, error?: unknown, options: LogOptions = {}) {
  printInDev(event, options, error);
  enqueue('error', event, options, error);
  void flushLogs();
}

/** A state the code should make impossible, e.g. the backend sent data in a shape the UI can't use. */
export function logBug(event: FrontendEvent, options: LogOptions = {}) {
  printInDev(event, options);
  enqueue('bug', event, options);
}

/**
 * What the user saw when a submitted action failed: the status and, for validation errors,
 * which fields were wrong. The request id comes from the ApiError.
 */
export function logFailedUi(event: FrontendEvent, error: unknown, context: LogContext = {}) {
  const apiError = error instanceof ApiError ? error : undefined;
  logWarning(event, {
    requestId: apiError?.requestId,
    context: {
      ...context,
      status: apiError?.status,
      fields: apiError?.fieldErrors ? Object.keys(apiError.fieldErrors).join(',') : undefined,
    },
  });
}

/** The route every following line is logged under. */
export function setCurrentRoute(route: string) {
  currentRoute = route;
}

/** Sends everything logged so far; resolves once that's done or has failed. Never rejects. */
export function flushLogs(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  // Chained, so a flush that starts while one is running still sends what came in since.
  sending = sending.then(sendQueued);
  return sending;
}

/**
 * Reports errors no code caught, and sends what's queued when the app goes to the
 * background (the user may close it from there). Call once, at startup.
 */
export function startLogging() {
  // React Native sets ErrorUtils up on Android and iOS; the web build has no such global.
  if (typeof ErrorUtils !== 'undefined') {
    const previousHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logError(isFatal ? 'app_crashed' : 'uncaught_error', error);
      // Handed on so a dev build still shows the red screen. A fatal error closes a release
      // build right away, so its report may not get out in time.
      previousHandler(error, isFatal);
    });
  }
  AppState.addEventListener('change', (state) => {
    if (state === 'background') void flushLogs();
  });
}

function enqueue(type: LogType, event: FrontendEvent, { requestId, context }: LogOptions, error?: unknown) {
  queue.push({
    timestamp: new Date().toISOString(),
    type,
    event,
    requestId,
    route: currentRoute,
    message: error instanceof Error ? error.message.slice(0, MAX_MESSAGE_LENGTH) : undefined,
    context: context && toStrings(context),
    stackTrace: error instanceof Error ? error.stack?.slice(0, MAX_STACK_LENGTH) : undefined,
  });
  if (queue.length > MAX_QUEUED) queue.splice(0, queue.length - MAX_QUEUED);
  if (queue.length >= BATCH_SIZE) {
    void flushLogs();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flushLogs, FLUSH_DELAY_MS);
  }
}

// The backend takes text values only; empty ones are left out.
function toStrings(context: LogContext): Record<string, string> {
  const strings: Record<string, string> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value !== undefined && value !== null) strings[key] = String(value).slice(0, MAX_CONTEXT_VALUE_LENGTH);
  }
  return strings;
}

async function sendQueued() {
  while (queue.length > 0) {
    const entries = queue.splice(0, BATCH_SIZE);
    try {
      await apiFetch('/v1/client-logs', {
        method: 'POST',
        body: {
          platform: Platform.OS,
          osVersion: Device.osVersion ?? undefined,
          deviceModel: Device.modelName ?? undefined,
          appVersion: Constants.expoConfig?.version,
          entries,
        },
        // A failure here must not be logged again, or it would report itself forever.
        silent: true,
      });
    } catch (err) {
      // A 400 means the lines themselves are wrong, so sending them again won't help.
      // Anything else (offline, signed out) keeps them for the next flush.
      if (!(err instanceof ApiError && err.status === 400)) {
        const room = Math.max(0, MAX_QUEUED - queue.length);
        queue.unshift(...entries.slice(Math.max(0, entries.length - room)));
      }
      return;
    }
  }
}

// In a dev build warnings, errors and bugs also show up in the Metro terminal and as a LogBox
// notice: console.warn, because console.error would raise LogBox's red banner for every
// failed request.
function printInDev(event: FrontendEvent, { context }: LogOptions, error?: unknown) {
  if (__DEV__) {
    console.warn(`[myPlunt] ${event}`, context ?? '', error ?? '');
  }
}
