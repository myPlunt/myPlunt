import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { apiFetch } from '@/lib/auth/api-client';
import { notificationsAllowed } from '@/lib/notification-permission';
import { deviceTimeZone } from '@/lib/time-zone';

const PUSH_TOKEN_PATH = '/v1/users/me/push-token';

export async function registerPushToken(): Promise<void> {
  if (Platform.OS === 'web' || !(await notificationsAllowed())) return;
  const { data: token } = await Notifications.getExpoPushTokenAsync();
  await apiFetch<void>(PUSH_TOKEN_PATH, { method: 'PUT', body: { token, timeZone: deviceTimeZone() } });
}

export async function removePushToken(): Promise<void> {
  if (Platform.OS === 'web') return;
  const { data: token } = await Notifications.getExpoPushTokenAsync();
  await apiFetch<void>(PUSH_TOKEN_PATH, { method: 'DELETE', body: { token } });
}
