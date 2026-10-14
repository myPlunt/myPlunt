import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as profileService from '@/features/profile/profile-service';
import { useWateringCalendar } from '@/features/profile/use-watering-calendar';
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
const waterings = [{ id: 'w1', plantId: 'p1', plantName: 'Vera', wateredAt: '2026-10-07T08:00:00Z' }];
const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
  mockedProfileService.getWaterings.mockResolvedValue(waterings);
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ log: useWateringCalendar(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

describe('useWateringCalendar', () => {
  it("loads this month's waterings", async () => {
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.log.isLoading).toBe(false));
    expect(result.current.log.month).toEqual(thisMonth);
    expect(mockedProfileService.getWaterings).toHaveBeenCalledWith(
      thisMonth,
      new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 1),
    );
    expect(result.current.log.waterings).toEqual(waterings);
    expect(result.current.log.canShowNextMonth).toBe(false);
  });

  it('pages back a month and forward again, but not past the current month', async () => {
    const { result } = await renderWithStore();
    await waitFor(() => expect(result.current.log.isLoading).toBe(false));
    const lastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1);

    await act(async () => result.current.log.showPreviousMonth());

    await waitFor(() => expect(mockedProfileService.getWaterings).toHaveBeenLastCalledWith(lastMonth, thisMonth));
    expect(result.current.log.month).toEqual(lastMonth);
    expect(result.current.log.canShowNextMonth).toBe(true);

    await act(async () => result.current.log.showNextMonth());
    await waitFor(() => expect(result.current.log.month).toEqual(thisMonth));
    const calls = mockedProfileService.getWaterings.mock.calls.length;

    await act(async () => result.current.log.showNextMonth());
    expect(result.current.log.month).toEqual(thisMonth);
    expect(mockedProfileService.getWaterings).toHaveBeenCalledTimes(calls);
  });

  it('exposes the backend message when loading fails', async () => {
    mockedProfileService.getWaterings.mockRejectedValue(
      new ApiError(400, 'irrelevant', { detail: 'Ask for at most 62 days of waterings at once' }),
    );
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.log.error).toBe('Ask for at most 62 days of waterings at once'));
    expect(result.current.log.isLoading).toBe(false);
  });

  it('signs the user out when the session has expired', async () => {
    mockedProfileService.getWaterings.mockRejectedValue(new ApiError(401, 'Not authenticated'));
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
    expect(result.current.log.error).toBeNull();
  });

  it('fetches again on retry', async () => {
    mockedProfileService.getWaterings.mockRejectedValueOnce(new ApiError(500, 'irrelevant'));
    const { result } = await renderWithStore();
    await waitFor(() => expect(result.current.log.error).not.toBeNull());

    await act(async () => {
      result.current.log.retry();
    });

    await waitFor(() => expect(result.current.log.waterings).toEqual(waterings));
    expect(result.current.log.error).toBeNull();
  });
});
