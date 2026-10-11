import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as plantService from '@/features/plants/plant-service';
import { usePlant } from '@/features/plants/use-plant';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/plants/plant-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedPlantService = jest.mocked(plantService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const vera = {
  id: 'p1',
  name: 'Vera',
  light: null,
  wateringEveryDays: null,
  notes: null,
  planterId: null,
  planterName: null,
  speciesId: null,
  speciesName: null,
  wateringFrequencyDays: null,
  lastWateredAt: null,
  nextWateringAt: null,
  photoUrl: null,
};

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ plant: usePlant('p1'), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

it('loads the plant by id', async () => {
  mockedPlantService.getPlant.mockResolvedValue(vera);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.plant.isLoading).toBe(false));
  expect(mockedPlantService.getPlant).toHaveBeenCalledWith('p1');
  expect(result.current.plant.plant).toEqual(vera);
  expect(result.current.plant.error).toBeNull();
});

it('exposes the backend message when loading fails', async () => {
  mockedPlantService.getPlant.mockRejectedValue(new ApiError(404, 'irrelevant', { detail: 'Plant not found' }));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.plant.error).toBe('Plant not found'));
  expect(result.current.plant.plant).toBeNull();
  expect(result.current.plant.isLoading).toBe(false);
});

it('signs the user out when the session has expired', async () => {
  mockedPlantService.getPlant.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  expect(result.current.plant.error).toBeNull();
});

it('fetches again on retry', async () => {
  mockedPlantService.getPlant.mockRejectedValueOnce(new ApiError(500, 'irrelevant'));
  mockedPlantService.getPlant.mockResolvedValueOnce(vera);
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.plant.error).not.toBeNull());

  await act(async () => {
    result.current.plant.retry();
  });

  await waitFor(() => expect(result.current.plant.plant).toEqual(vera));
  expect(result.current.plant.error).toBeNull();
  expect(mockedPlantService.getPlant).toHaveBeenCalledTimes(2);
});
