import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { logWarning } from '@/lib/logger';

export async function requestNotificationPermission(): Promise<boolean> {
  // Android 13+ only shows the prompt once a channel exists; iOS has no channels.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Plant care',
      importance: AndroidImportance.DEFAULT,
    });
  }
  const { granted } = await Notifications.requestPermissionsAsync();
  if (!granted) logWarning('notification_permission_denied');
  return granted;
}

export async function notificationsAllowed(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
}

/** Asks again while the system still allows it; after that only the phone's settings can turn them on. */
export async function turnOnNotifications(): Promise<boolean> {
  const { canAskAgain } = await Notifications.getPermissionsAsync();
  if (canAskAgain) return requestNotificationPermission();
  await Linking.openSettings();
  return false;
}
