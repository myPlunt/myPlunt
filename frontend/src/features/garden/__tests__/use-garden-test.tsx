import { renderHook, waitFor } from '@testing-library/react-native';

import * as gardenService from '@/features/garden/garden-service';
import { useGarden } from '@/features/garden/use-garden';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/garden/garden-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedGardenService = jest.mocked(gardenService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const garden = { rooms: [{ id: 'r1', name: 'Balcony', plants: [] }] };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ garden: useGarden(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

it('loads the garden', async () => {
  mockedGardenService.getGarden.mockResolvedValue(garden);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.garden.isLoading).toBe(false));
  expect(result.current.garden.garden).toEqual(garden);
  expect(result.current.garden.error).toBeNull();
});

it('signs the user out when the session has expired', async () => {
  mockedGardenService.getGarden.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  expect(result.current.garden.error).toBeNull();
});
