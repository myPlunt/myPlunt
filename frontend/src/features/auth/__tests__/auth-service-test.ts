import * as authService from '@/features/auth/auth-service';
import { publicFetch } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';

jest.mock('@/lib/auth/api-client', () => ({ publicFetch: jest.fn() }));
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn() },
}));

const mockedPublicFetch = jest.mocked(publicFetch);
const mockedTokenStorage = jest.mocked(tokenStorage);

afterEach(() => {
  jest.resetAllMocks();
});

describe('login', () => {
  it('posts credentials and stores the returned tokens', async () => {
    mockedPublicFetch.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await authService.login({ email: 'jane@example.com', password: 'password123' });

    expect(mockedPublicFetch).toHaveBeenCalledWith('/v1/auth/login', {
      email: 'jane@example.com',
      password: 'password123',
    });
    expect(mockedTokenStorage.setTokens).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
  });
});

describe('register', () => {
  it('posts details and stores the returned tokens', async () => {
    mockedPublicFetch.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await authService.register({ username: 'jane', email: 'jane@example.com', password: 'password123' });

    expect(mockedPublicFetch).toHaveBeenCalledWith('/v1/auth/register', {
      username: 'jane',
      email: 'jane@example.com',
      password: 'password123',
    });
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

  it('clears local tokens and skips the backend call when there was nothing stored', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue(null);

    await authService.logout();

    expect(mockedTokenStorage.clearTokens).toHaveBeenCalled();
    expect(mockedPublicFetch).not.toHaveBeenCalled();
  });
});
