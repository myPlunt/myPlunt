import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as authService from '@/features/auth/auth-service';
import { useAuthActions } from '@/features/auth/use-auth-actions';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';
import { OnboardingStoreProvider, useOnboardingStore } from '@/stores/onboarding-store';

jest.mock('@/features/auth/auth-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedAuthService = jest.mocked(authService);
const mockedTokenStorage = jest.mocked(tokenStorage);

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue(null);
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(
    () => ({ actions: useAuthActions(), store: useAuthStore(), onboarding: useOnboardingStore() }),
    {
      wrapper: ({ children }) => (
        <AuthStoreProvider>
          <OnboardingStoreProvider>{children}</OnboardingStoreProvider>
        </AuthStoreProvider>
      ),
    },
  );
}

it('register signs the new user in and starts the tour on the welcome page', async () => {
  mockedAuthService.register.mockResolvedValue(undefined);
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));

  await act(async () => {
    await result.current.actions.register({ username: 'jane', email: 'jane@example.com', password: 'password123' });
  });

  expect(result.current.store.status).toBe('authenticated');
  expect(result.current.onboarding.step).toBe('welcome');
});

it('login calls the service then flips the store to authenticated', async () => {
  mockedAuthService.login.mockResolvedValue(undefined);
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));

  await act(async () => {
    await result.current.actions.login({ email: 'jane@example.com', password: 'password123' });
  });

  expect(mockedAuthService.login).toHaveBeenCalledWith({
    email: 'jane@example.com',
    password: 'password123',
  });
  expect(result.current.store.status).toBe('authenticated');
});

it('logout calls the service then flips the store to unauthenticated', async () => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
  mockedAuthService.logout.mockResolvedValue(undefined);
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.store.status).toBe('authenticated'));

  await act(async () => {
    await result.current.actions.logout();
  });

  expect(mockedAuthService.logout).toHaveBeenCalled();
  expect(result.current.store.status).toBe('unauthenticated');
});

it('does not flip the store when login fails', async () => {
  mockedAuthService.login.mockRejectedValue(new Error('invalid credentials'));
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));

  await act(async () => {
    await expect(
      result.current.actions.login({ email: 'jane@example.com', password: 'wrong' }),
    ).rejects.toThrow('invalid credentials');
  });

  expect(result.current.store.status).toBe('unauthenticated');
});
