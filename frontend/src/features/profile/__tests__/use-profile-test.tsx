import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as profileService from '@/features/profile/profile-service';
import { useProfile } from '@/features/profile/use-profile';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/profile/profile-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedProfileService = jest.mocked(profileService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ profile: useProfile(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

it('loads the current user', async () => {
  mockedProfileService.getCurrentUser.mockResolvedValue(jane);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.profile.isLoading).toBe(false));
  expect(result.current.profile.user).toEqual(jane);
  expect(result.current.profile.error).toBeNull();
});

it('exposes the backend message when loading fails', async () => {
  mockedProfileService.getCurrentUser.mockRejectedValue(
    new ApiError(404, 'irrelevant', { detail: 'User not found' }),
  );
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.profile.error).toBe('User not found'));
  expect(result.current.profile.user).toBeNull();
  expect(result.current.profile.isLoading).toBe(false);
});

it('signs the user out when the session has expired', async () => {
  mockedProfileService.getCurrentUser.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  expect(result.current.profile.error).toBeNull();
});

it('fetches again on retry', async () => {
  mockedProfileService.getCurrentUser.mockRejectedValueOnce(new ApiError(500, 'irrelevant'));
  mockedProfileService.getCurrentUser.mockResolvedValueOnce(jane);
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.profile.error).not.toBeNull());

  await act(async () => {
    result.current.profile.retry();
  });

  await waitFor(() => expect(result.current.profile.user).toEqual(jane));
  expect(result.current.profile.error).toBeNull();
  expect(mockedProfileService.getCurrentUser).toHaveBeenCalledTimes(2);
});
