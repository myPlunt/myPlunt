import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as plantService from '@/features/plants/plant-service';
import { useWateringHistory } from '@/features/plants/use-watering-history';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/plants/plant-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]),
  };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedPlantService = jest.mocked(plantService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const history = {
  plantName: 'Vera',
  wateringFrequencyDays: 7,
  currentStreak: 1,
  bestStreak: 1,
  onTimePercent: 100,
  overdue: false,
  waterings: [{ id: 'w1', wateredAt: '2026-10-07T08:00:00Z', daysLate: 0 }],
};

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({
    accessToken: 'a',
    refreshToken: 'r',
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ waterings: useWateringHistory('p1'), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

describe('useWateringHistory', () => {
  it("loads the plant's waterings by id", async () => {
    mockedPlantService.getWateringHistory.mockResolvedValue(history);
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.waterings.isLoading).toBe(false));
    expect(mockedPlantService.getWateringHistory).toHaveBeenCalledWith('p1');
    expect(result.current.waterings.history).toEqual(history);
    expect(result.current.waterings.error).toBeNull();
  });

  it('exposes the backend message when loading fails', async () => {
    mockedPlantService.getWateringHistory.mockRejectedValue(
      new ApiError(404, 'irrelevant', { detail: 'Plant not found' }),
    );
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.waterings.error).toBe('Plant not found'));
    expect(result.current.waterings.history).toBeNull();
    expect(result.current.waterings.isLoading).toBe(false);
  });

  it('signs the user out when the session has expired', async () => {
    mockedPlantService.getWateringHistory.mockRejectedValue(new ApiError(401, 'Not authenticated'));
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
    expect(result.current.waterings.error).toBeNull();
  });

  it('fetches again on retry', async () => {
    mockedPlantService.getWateringHistory.mockRejectedValueOnce(new ApiError(500, 'irrelevant'));
    mockedPlantService.getWateringHistory.mockResolvedValueOnce(history);
    const { result } = await renderWithStore();
    await waitFor(() => expect(result.current.waterings.error).not.toBeNull());

    await act(async () => {
      result.current.waterings.retry();
    });

    await waitFor(() => expect(result.current.waterings.history).toEqual(history));
    expect(result.current.waterings.error).toBeNull();
    expect(mockedPlantService.getWateringHistory).toHaveBeenCalledTimes(2);
  });
});
