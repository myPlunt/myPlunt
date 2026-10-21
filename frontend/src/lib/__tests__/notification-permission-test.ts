import * as Notifications from 'expo-notifications';
import { Linking, Platform } from 'react-native';

import { requestNotificationPermission, turnOnNotifications } from '@/lib/notification-permission';

jest.mock('@/lib/logger');

const mockedNotifications = jest.mocked(Notifications);
const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
  jest.resetAllMocks();
});

function permission(granted: boolean, canAskAgain = true) {
  return { granted, canAskAgain } as Notifications.NotificationPermissionsStatus;
}

describe('notification permission', () => {
  it('creates a channel on Android before asking, so the Android 13+ prompt appears', async () => {
    Platform.OS = 'android';
    const order: string[] = [];
    mockedNotifications.setNotificationChannelAsync.mockImplementation(async () => {
      order.push('channel');
      return null;
    });
    mockedNotifications.requestPermissionsAsync.mockImplementation(async () => {
      order.push('request');
      return permission(true);
    });

    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(order).toEqual(['channel', 'request']);
  });

  it("opens the phone's settings once the system won't ask again", async () => {
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    mockedNotifications.getPermissionsAsync.mockResolvedValue(permission(false, false));

    await expect(turnOnNotifications()).resolves.toBe(false);
    expect(mockedNotifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(openSettings).toHaveBeenCalled();
  });
});
