import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as plantService from '@/features/plants/plant-service';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/plants/plant-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedPlantService = jest.mocked(plantService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const request = { name: 'Vera', light: null, wateringEveryDays: 7, notes: null, planterId: null, speciesId: null };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

async function renderWithStore() {
  const rendered = await renderHook(() => ({ actions: usePlantActions(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
  await waitFor(() => expect(rendered.result.current.store.status).toBe('authenticated'));
  return rendered;
}

it('createPlant returns the saved plant from the service', async () => {
  const saved = { id: 'p1', ...request };
  mockedPlantService.createPlant.mockResolvedValue(saved);
  const { result } = await renderWithStore();

  let returned;
  await act(async () => {
    returned = await result.current.actions.createPlant(request);
  });

  expect(mockedPlantService.createPlant).toHaveBeenCalledWith(request);
  expect(returned).toEqual(saved);
});

it('createPlant signs the user out and rethrows when the session has expired', async () => {
  mockedPlantService.createPlant.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await act(async () => {
    await expect(result.current.actions.createPlant(request)).rejects.toBeInstanceOf(ApiError);
  });

  expect(result.current.store.status).toBe('unauthenticated');
});

it('createPlant rethrows other errors without changing the session', async () => {
  mockedPlantService.createPlant.mockRejectedValue(new ApiError(400, 'Validation failed'));
  const { result } = await renderWithStore();

  await act(async () => {
    await expect(result.current.actions.createPlant(request)).rejects.toBeInstanceOf(ApiError);
  });

  expect(result.current.store.status).toBe('authenticated');
});
