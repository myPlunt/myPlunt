import { renderHook, waitFor } from '@testing-library/react-native';

import * as speciesService from '@/features/species/species-service';
import { useSpecies } from '@/features/species/use-species';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/species/species-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedSpeciesService = jest.mocked(speciesService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const monstera = { id: 's1', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7 };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ result: useSpecies(), store: useAuthStore() }), { wrapper: AuthStoreProvider });
}

it('starts empty and then holds the loaded species', async () => {
  mockedSpeciesService.getSpecies.mockResolvedValue([monstera]);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.result.species).toEqual([monstera]));
  expect(result.current.result.error).toBeNull();
});

it('shows the backend message when loading fails', async () => {
  mockedSpeciesService.getSpecies.mockRejectedValue(new ApiError(500, 'x', { detail: 'An unexpected error occurred' }));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.result.error).toBe('An unexpected error occurred'));
  expect(result.current.result.species).toBeNull();
});

it('signs the user out when the session has expired', async () => {
  mockedSpeciesService.getSpecies.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
});
