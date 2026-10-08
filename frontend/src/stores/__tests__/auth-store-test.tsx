import { act, renderHook, waitFor } from '@testing-library/react-native';

import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedTokenStorage = jest.mocked(tokenStorage);

afterEach(() => {
  jest.resetAllMocks();
});

it('throws when used outside the provider', async () => {
  const { result } = await renderHook(() => {
    try {
      return useAuthStore();
    } catch (error) {
      return error;
    }
  });

  expect(result.current).toBeInstanceOf(Error);
});

it('resolves to authenticated when tokens are already stored', async () => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

  const { result } = await renderHook(() => useAuthStore(), { wrapper: AuthStoreProvider });

  await waitFor(() => expect(result.current.status).toBe('authenticated'));
});

it('resolves to unauthenticated when no tokens are stored', async () => {
  mockedTokenStorage.getTokens.mockResolvedValue(null);

  const { result } = await renderHook(() => useAuthStore(), { wrapper: AuthStoreProvider });

  await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
});

it('setAuthenticated/setUnauthenticated flip the status', async () => {
  mockedTokenStorage.getTokens.mockResolvedValue(null);

  const { result } = await renderHook(() => useAuthStore(), { wrapper: AuthStoreProvider });
  await waitFor(() => expect(result.current.status).toBe('unauthenticated'));

  await act(async () => result.current.setAuthenticated());
  expect(result.current.status).toBe('authenticated');

  await act(async () => result.current.setUnauthenticated());
  expect(result.current.status).toBe('unauthenticated');
});
