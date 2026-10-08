import * as SecureStore from 'expo-secure-store';

import { tokenStorage } from '@/lib/auth/token-storage';

jest.mock('expo-secure-store');

const mockedSecureStore = jest.mocked(SecureStore);

describe('tokenStorage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns null when either token is missing', async () => {
    mockedSecureStore.getItemAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce(null);

    expect(await tokenStorage.getTokens()).toBeNull();
  });

  it('returns both tokens when present', async () => {
    mockedSecureStore.getItemAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    expect(await tokenStorage.getTokens()).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('writes both tokens on setTokens', async () => {
    await tokenStorage.setTokens({ accessToken: 'a', refreshToken: 'r' });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('myplunt.accessToken', 'a');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('myplunt.refreshToken', 'r');
  });

  it('deletes both tokens on clearTokens', async () => {
    await tokenStorage.clearTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('myplunt.accessToken');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('myplunt.refreshToken');
  });
});
