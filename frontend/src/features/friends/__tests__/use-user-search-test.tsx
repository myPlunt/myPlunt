import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as friendsService from '@/features/friends/friends-service';
import { useUserSearch } from '@/features/friends/use-user-search';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/friends/friends-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedFriendsService = jest.mocked(friendsService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const jane = { id: 'u2', username: 'jane_doe', bio: null, avatarUrl: null, friendship: null };

beforeEach(() => {
  jest.useFakeTimers();
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

function renderWithStore(query: string) {
  return renderHook(({ q }: { q: string }) => ({ search: useUserSearch(q), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
    initialProps: { q: query },
  });
}

it('searches only once typing pauses, with the last query', async () => {
  mockedFriendsService.searchUsers.mockResolvedValue([jane]);
  const { result, rerender } = await renderWithStore('j');
  await rerender({ q: 'ja' });
  await rerender({ q: ' jan ' });

  expect(mockedFriendsService.searchUsers).not.toHaveBeenCalled();
  expect(result.current.search.isLoading).toBe(true);

  await act(() => jest.advanceTimersByTime(300));

  await waitFor(() => expect(result.current.search.isLoading).toBe(false));
  expect(mockedFriendsService.searchUsers).toHaveBeenCalledTimes(1);
  expect(mockedFriendsService.searchUsers).toHaveBeenCalledWith('jan');
  expect(result.current.search.users).toEqual([jane]);
});

it('does not search a blank query', async () => {
  const { result } = await renderWithStore('   ');
  await act(() => jest.advanceTimersByTime(300));

  expect(mockedFriendsService.searchUsers).not.toHaveBeenCalled();
  expect(result.current.search).toEqual({ users: null, error: null, isLoading: false });
});
