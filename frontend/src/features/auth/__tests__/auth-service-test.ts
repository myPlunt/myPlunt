import AsyncStorage from '@react-native-async-storage/async-storage';

import * as authService from '@/features/auth/auth-service';
import { publicFetch } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { cachedFetch } from '@/lib/offline/cache';

jest.mock('@/lib/auth/api-client', () => ({ publicFetch: jest.fn() }));
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn() },
}));

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
