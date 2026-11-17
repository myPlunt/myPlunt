import AsyncStorage from '@react-native-async-storage/async-storage';

import * as authService from '@/features/auth/auth-service';
import { ApiError, apiFetch, publicFetch } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { cachedFetch } from '@/lib/offline/cache';

jest.mock('@/lib/auth/api-client', () => ({
  ...jest.requireActual('@/lib/auth/api-client'),
  apiFetch: jest.fn(),
  publicFetch: jest.fn(),
}));
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn() },
}));

const mockedApiFetch = jest.mocked(apiFetch);
const mockedPublicFetch = jest.mocked(publicFetch);
const mockedTokenStorage = jest.mocked(tokenStorage);

afterEach(() => {
  jest.resetAllMocks();
});

async function saveForOffline() {
  await cachedFetch('garden', async () => ({ rooms: [] }));
  expect(await AsyncStorage.getAllKeys()).not.toEqual([]);
}

describe('login', () => {
  it('posts credentials and stores the returned tokens', async () => {
    mockedPublicFetch.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await authService.login({ email: 'jane@example.com', password: 'password123' });

    expect(mockedPublicFetch).toHaveBeenCalledWith(
      '/v1/auth/login',
      { email: 'jane@example.com', password: 'password123' },
      expect.anything(),
    );
    expect(mockedTokenStorage.setTokens).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
  });

  it('forgets what the previous account saved for offline, even if it never logged out', async () => {
    await saveForOffline();
    mockedPublicFetch.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await authService.login({ email: 'jane@example.com', password: 'password123' });

    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });
});

describe('register', () => {
  it('posts details and stores the returned tokens', async () => {
    mockedPublicFetch.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await authService.register({ username: 'jane', email: 'jane@example.com', password: 'password123' });

    expect(mockedPublicFetch).toHaveBeenCalledWith(
      '/v1/auth/register',
      { username: 'jane', email: 'jane@example.com', password: 'password123' },
      expect.anything(),
    );
    expect(mockedTokenStorage.setTokens).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
  });
});

describe('logout', () => {
  it('clears local tokens and notifies the backend when a refresh token existed', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    mockedPublicFetch.mockResolvedValue(undefined);

    await authService.logout();

    expect(mockedTokenStorage.clearTokens).toHaveBeenCalled();
    expect(mockedPublicFetch).toHaveBeenCalledWith('/v1/auth/logout', { refreshToken: 'r' });
  });

  it('forgets what was saved for offline', async () => {
    await saveForOffline();

    await authService.logout();

    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });
});

describe('deleteAccount', () => {
  it('deletes the account, then forgets the session and everything saved for offline', async () => {
    await saveForOffline();
    mockedApiFetch.mockResolvedValue(undefined);

    await authService.deleteAccount({ currentPassword: 'password123' });

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/v1/users/me',
      expect.objectContaining({ method: 'DELETE', body: { currentPassword: 'password123' } }),
    );
    expect(mockedTokenStorage.clearTokens).toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });

  it('keeps the session and offline data when the backend refuses', async () => {
    await saveForOffline();
    mockedApiFetch.mockRejectedValue(new ApiError(403, 'Current password is incorrect'));

    await expect(authService.deleteAccount({ currentPassword: 'wrong' })).rejects.toThrow();

    expect(mockedTokenStorage.clearTokens).not.toHaveBeenCalled();
    expect(await AsyncStorage.getAllKeys()).not.toEqual([]);
  });
});
