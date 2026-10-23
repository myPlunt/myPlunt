import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as speciesService from '@/features/species/species-service';
import { useSpecies } from '@/features/species/use-species';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { Species } from '@/lib/species/types';
import { AuthStoreProvider } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

jest.mock('@/features/species/species-service');
jest.mock('@/lib/auth/token-storage', () => ({ tokenStorage: { getTokens: jest.fn() } }));
jest.mock('@/stores/network-store', () => ({ useReloadOnReconnect: jest.fn() }));

const mockedGetSpecies = jest.mocked(speciesService.getSpecies);
const monstera = { id: 'monstera', commonName: 'Monstera' } as Species;

function reconnect() {
  const reload = jest.mocked(useReloadOnReconnect).mock.lastCall![0];
  return act(() => reload());
}

beforeEach(() => {
  jest.mocked(tokenStorage.getTokens).mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

it('loads the species again once the connection is back, instead of keeping the error', async () => {
  mockedGetSpecies.mockRejectedValueOnce(new ApiError(0, 'Network request failed', { detail: "Can't reach myPlunt" }));
  const { result } = await renderHook(() => useSpecies(), { wrapper: AuthStoreProvider });
  await waitFor(() => expect(result.current.error).toBe("Can't reach myPlunt"));

  mockedGetSpecies.mockResolvedValueOnce([monstera]);
  await reconnect();

  await waitFor(() => expect(result.current.species).toEqual([monstera]));
  expect(result.current.error).toBeNull();
});
