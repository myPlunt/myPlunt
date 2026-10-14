import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as friendsService from '@/features/friends/friends-service';
import { useFriends } from '@/features/friends/use-friends';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/friends/friends-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedFriendsService = jest.mocked(friendsService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const tom = { id: 'u3', username: 'tom', bio: null, avatarUrl: null, friendship: 'friends' } as const;
const sam = { id: 'u4', username: 'sam', bio: null, avatarUrl: null, friendship: 'request_received' } as const;
const requests = { received: [sam], sent: [] };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ friends: useFriends(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

it('loads friends and requests together', async () => {
  mockedFriendsService.getFriends.mockResolvedValue([tom]);
  mockedFriendsService.getFriendRequests.mockResolvedValue(requests);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.friends.isLoading).toBe(false));
  expect(result.current.friends.friends).toEqual([tom]);
  expect(result.current.friends.requests).toEqual(requests);
  expect(result.current.friends.error).toBeNull();
});

it('exposes the backend message when loading fails', async () => {
  mockedFriendsService.getFriends.mockResolvedValue([tom]);
  mockedFriendsService.getFriendRequests.mockRejectedValue(new ApiError(500, 'irrelevant', { detail: 'Broken' }));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.friends.error).toBe('Broken'));
  expect(result.current.friends.isLoading).toBe(false);
});

it('signs the user out when the session has expired', async () => {
  mockedFriendsService.getFriends.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  mockedFriendsService.getFriendRequests.mockResolvedValue(requests);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  expect(result.current.friends.error).toBeNull();
});

it('reloads behind the current lists without the spinner', async () => {
  mockedFriendsService.getFriends.mockResolvedValueOnce([]).mockResolvedValueOnce([tom]);
  mockedFriendsService.getFriendRequests.mockResolvedValueOnce(requests).mockResolvedValueOnce({ received: [], sent: [] });
  const { result } = await renderWithStore();
  await waitFor(() => expect(result.current.friends.isLoading).toBe(false));

  await act(async () => {
    result.current.friends.reload();
  });

  expect(result.current.friends.isLoading).toBe(false);
  await waitFor(() => expect(result.current.friends.friends).toEqual([tom]));
  expect(result.current.friends.requests).toEqual({ received: [], sent: [] });
});
