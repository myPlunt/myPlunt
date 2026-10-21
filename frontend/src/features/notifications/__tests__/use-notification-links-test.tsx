import { renderHook } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';

import { useNotificationLinks } from '../use-notification-links';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const mockedNotifications = jest.mocked(Notifications);
const push = jest.fn();

function tapped(url: unknown, actionIdentifier = Notifications.DEFAULT_ACTION_IDENTIFIER) {
  return { actionIdentifier, notification: { request: { content: { data: { url } } } } } as unknown as Notifications.NotificationResponse;
}

describe('useNotificationLinks', () => {
  beforeEach(() => {
    jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("opens the tapped notification's screen once", async () => {
    mockedNotifications.useLastNotificationResponse.mockReturnValue(tapped('/friends?tab=requests'));

    await renderHook(() => useNotificationLinks());

    expect(push).toHaveBeenCalledWith('/friends?tab=requests');
    expect(mockedNotifications.clearLastNotificationResponse).toHaveBeenCalled();
  });

  it('stays put when no notification was tapped', async () => {
    mockedNotifications.useLastNotificationResponse.mockReturnValue(null);

    await renderHook(() => useNotificationLinks());

    expect(push).not.toHaveBeenCalled();
  });
});
