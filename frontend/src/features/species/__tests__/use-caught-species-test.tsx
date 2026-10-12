import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as speciesService from '@/features/species/species-service';
import { useCaughtSpecies } from '@/features/species/use-caught-species';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/species/species-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedSpeciesService = jest.mocked(speciesService);
const mockedTokenStorage = jest.mocked(tokenStorage);

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ caught: useCaughtSpecies(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

it('loads the caught species ids', async () => {
  mockedSpeciesService.getCaughtSpeciesIds.mockResolvedValue(['basil']);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.caught.isLoading).toBe(false));
  expect(result.current.caught.caughtIds).toEqual(['basil']);
  expect(result.current.caught.error).toBeNull();
});

it('signs the user out when the session has expired', async () => {
  mockedSpeciesService.getCaughtSpeciesIds.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  expect(result.current.caught.error).toBeNull();
});

it('fetches again on retry', async () => {
  mockedSpeciesService.getCaughtSpeciesIds.mockRejectedValueOnce(new ApiError(500, 'irrelevant'));
  mockedSpeciesService.getCaughtSpeciesIds.mockResolvedValueOnce(['basil']);
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.caught.error).not.toBeNull());

  await act(async () => {
    result.current.caught.retry();
  });

  await waitFor(() => expect(result.current.caught.caughtIds).toEqual(['basil']));
  expect(result.current.caught.error).toBeNull();
});
