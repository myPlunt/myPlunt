import * as Notifications from 'expo-notifications';

import { apiFetch } from '@/lib/auth/api-client';
import { notificationsAllowed } from '@/lib/notification-permission';
import { deviceTimeZone } from '@/lib/time-zone';

import { registerPushToken } from '../push-token-service';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));
jest.mock('@/lib/notification-permission');
jest.mock('@/lib/time-zone');

const mockedNotifications = jest.mocked(Notifications);

describe('registerPushToken', () => {
  beforeEach(() => {
    jest.mocked(deviceTimeZone).mockReturnValue('Europe/Amsterdam');
    mockedNotifications.getExpoPushTokenAsync.mockResolvedValue({ type: 'expo', data: 'ExponentPushToken[abc]' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("sends the phone's push token with its time zone when notifications are allowed", async () => {
    jest.mocked(notificationsAllowed).mockResolvedValue(true);

    await registerPushToken();

    expect(apiFetch).toHaveBeenCalledWith('/v1/users/me/push-token', {
      method: 'PUT',
      body: { token: 'ExponentPushToken[abc]', timeZone: 'Europe/Amsterdam' },
    });
  });

  it('sends nothing while notifications are off', async () => {
    jest.mocked(notificationsAllowed).mockResolvedValue(false);

    await registerPushToken();

    expect(mockedNotifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(apiFetch).not.toHaveBeenCalled();
  });
});
