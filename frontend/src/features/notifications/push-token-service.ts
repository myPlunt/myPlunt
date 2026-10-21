import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiFetch } from '@/lib/auth/api-client';
import { notificationsAllowed } from '@/lib/notification-permission';
import { deviceTimeZone } from '@/lib/time-zone';

const PUSH_TOKEN_PATH = '/v1/users/me/push-token';

/**
 * Saves this phone's push token and time zone, so the backend can send its watering reminders
 * at 9:00 local time. Does nothing while notifications are off.
 */
export async function registerPushToken(): Promise<void> {
  // Web has no Expo push token; reminders are for the Android and iOS apps.
  if (Platform.OS === 'web' || !(await notificationsAllowed())) return;
  const { data: token } = await Notifications.getExpoPushTokenAsync();
  await apiFetch<void>(PUSH_TOKEN_PATH, { method: 'PUT', body: { token, timeZone: deviceTimeZone() } });
}

/** Stops the signed-in account's reminders on this phone; sent on logout while the session still exists. */
export async function removePushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  const { data: token } = await Notifications.getExpoPushTokenAsync();
  await apiFetch<void>(PUSH_TOKEN_PATH, { method: 'DELETE', body: { token } });
}
