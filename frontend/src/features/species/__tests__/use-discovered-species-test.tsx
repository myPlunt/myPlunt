import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as speciesService from '@/features/species/species-service';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
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
const basil = [{ speciesId: 'basil', discoveredAt: '2026-10-11T09:30:00Z' }];

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ discovered: useDiscoveredSpecies(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

it('loads the discovered species', async () => {
  mockedSpeciesService.getDiscoveredSpecies.mockResolvedValue(basil);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.discovered.isLoading).toBe(false));
  expect(result.current.discovered.discovered).toEqual(basil);
  expect(result.current.discovered.error).toBeNull();
});

it('signs the user out when the session has expired', async () => {
  mockedSpeciesService.getDiscoveredSpecies.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  expect(result.current.discovered.error).toBeNull();
});

it('fetches again on retry', async () => {
  mockedSpeciesService.getDiscoveredSpecies.mockRejectedValueOnce(new ApiError(500, 'irrelevant'));
  mockedSpeciesService.getDiscoveredSpecies.mockResolvedValueOnce(basil);
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.discovered.error).not.toBeNull());

  await act(async () => {
    result.current.discovered.retry();
  });

  await waitFor(() => expect(result.current.discovered.discovered).toEqual(basil));
  expect(result.current.discovered.error).toBeNull();
});
