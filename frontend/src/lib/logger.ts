import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { apiFetch } from '@/lib/auth/api-client';

// The backend's limits for POST /v1/client-logs (ClientLogRequest).
const MAX_MESSAGE_LENGTH = 1000;
const MAX_DETAILS_LENGTH = 8000;

// Sends the error to the backend, which writes it to its log file marked "service":"frontend".
// In a dev build it also shows up in the Metro terminal and as a LogBox notice in the app:
// console.warn, because console.error would raise LogBox's red banner for every failed request.
export function logError(message: string, details?: unknown) {
  if (__DEV__) {
    console.warn(`[myPlunt] ${message}`, details ?? '');
  }
  apiFetch('/v1/client-logs', {
    method: 'POST',
    body: {
      message: message.slice(0, MAX_MESSAGE_LENGTH),
      details: describeDetails(details)?.slice(0, MAX_DETAILS_LENGTH),
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version,
    },
    // A failure here must not be logged again, or it would report itself forever.
    silent: true,
  }).catch(() => {
    // Best effort: offline or signed out (the backend only takes reports from signed-in
    // users), the error is dropped.
  });
}

function describeDetails(details: unknown): string | undefined {
  if (details === undefined || details === null) return undefined;
  if (details instanceof Error) return details.stack ?? `${details.name}: ${details.message}`;
  if (typeof details === 'string') return details;
  try {
    return JSON.stringify(details);
  } catch {
    return String(details);
  }
}

// Errors no code caught (a crash while rendering, a rejected handler) go to React Native's
// global handler. Reports them, then hands them on so a dev build still shows the red screen.
// A fatal error closes a release build right away, so its report may not get out in time.
export function reportUncaughtErrors() {
  // React Native sets ErrorUtils up on Android and iOS; the web build has no such global.
  if (typeof ErrorUtils === 'undefined') return;
  const previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logError(isFatal ? 'App crashed' : 'Uncaught error', error);
    previousHandler(error, isFatal);
  });
}
