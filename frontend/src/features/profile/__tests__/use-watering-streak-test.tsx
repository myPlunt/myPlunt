import { renderHook, waitFor } from '@testing-library/react-native';

import * as profileService from '@/features/profile/profile-service';
import { useWateringStreak } from '@/features/profile/use-watering-streak';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/profile/profile-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedProfileService = jest.mocked(profileService);
const mockedTokenStorage = jest.mocked(tokenStorage);

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ streak: useWateringStreak(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

describe('useWateringStreak', () => {
  it("loads the user's streak", async () => {
    mockedProfileService.getWateringStreak.mockResolvedValue({ wateringStreak: 7 });
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.streak).toBe(7));
  });

  it('stays empty when loading fails', async () => {
    mockedProfileService.getWateringStreak.mockRejectedValue(new ApiError(500, 'irrelevant'));
    const { result } = await renderWithStore();

    await waitFor(() => expect(mockedProfileService.getWateringStreak).toHaveBeenCalled());
    expect(result.current.streak).toBeNull();
  });

  it('signs the user out when the session has expired', async () => {
    mockedProfileService.getWateringStreak.mockRejectedValue(new ApiError(401, 'Not authenticated'));
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  });
});
