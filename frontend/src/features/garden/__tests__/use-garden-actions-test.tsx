import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as gardenService from '@/features/garden/garden-service';
import { useGardenActions } from '@/features/garden/use-garden-actions';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/garden/garden-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedGardenService = jest.mocked(gardenService);
const mockedTokenStorage = jest.mocked(tokenStorage);

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
  mockedGardenService.waterPlant.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.resetAllMocks();
});

async function renderWithStore() {
  const rendered = await renderHook(() => ({ actions: useGardenActions(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
  await waitFor(() => expect(rendered.result.current.store.status).toBe('authenticated'));
  return rendered;
}

it('waterPlants waters every plant it is given', async () => {
  const { result } = await renderWithStore();

  await act(async () => {
    await result.current.actions.waterPlants(['p1', 'p2']);
  });

  expect(mockedGardenService.waterPlant).toHaveBeenCalledTimes(2);
  expect(mockedGardenService.waterPlant).toHaveBeenCalledWith('p1');
  expect(mockedGardenService.waterPlant).toHaveBeenCalledWith('p2');
});

it('waterPlants signs the user out and rethrows when the session has expired', async () => {
  mockedGardenService.waterPlant.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await act(async () => {
    await expect(result.current.actions.waterPlants(['p1'])).rejects.toThrow(ApiError);
  });

  expect(result.current.store.status).toBe('unauthenticated');
});
