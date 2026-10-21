import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as profileService from '@/features/profile/profile-service';
import { useNotificationSettings } from '@/features/profile/use-notification-settings';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider } from '@/stores/auth-store';

jest.mock('@/features/profile/profile-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedProfileService = jest.mocked(profileService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const allOn = { waterReminders: true, weatherAlerts: true, friendActivity: true, friendNudges: true, plantSitting: true };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
  mockedProfileService.getNotificationSettings.mockResolvedValue(allOn);
});

afterEach(() => {
  jest.resetAllMocks();
});

async function renderLoaded() {
  const rendered = await renderHook(() => useNotificationSettings(), { wrapper: AuthStoreProvider });
  await waitFor(() => expect(rendered.result.current.settings).toEqual(allOn));
  return rendered;
}

describe('useNotificationSettings', () => {
  it('saves the whole settings object with the toggled switch', async () => {
    mockedProfileService.updateNotificationSettings.mockResolvedValue({ ...allOn, weatherAlerts: false });
    const { result } = await renderLoaded();

    await act(() => result.current.toggle('weatherAlerts', false));

    expect(mockedProfileService.updateNotificationSettings).toHaveBeenCalledWith({ ...allOn, weatherAlerts: false });
    expect(result.current.settings?.weatherAlerts).toBe(false);
  });

  it('puts the switch back and shows the error when saving fails', async () => {
    mockedProfileService.updateNotificationSettings.mockRejectedValue(
      new ApiError(500, 'Something went wrong'),
    );
    const { result } = await renderLoaded();

    await act(() => result.current.toggle('waterReminders', false));

    expect(result.current.settings).toEqual(allOn);
    expect(result.current.error).not.toBeNull();
  });
});
