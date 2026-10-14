import { searchUsers, sendFriendRequest } from '@/features/friends/friends-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('searchUsers', () => {
  it('fetches /v1/users/search with the query encoded', async () => {
    const users = [{ id: 'u2', username: 'jane_doe', bio: null }];
    mockedApiFetch.mockResolvedValue(users);

    await expect(searchUsers('jane d&')).resolves.toEqual(users);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/search?q=jane%20d%26');
  });
});

describe('sendFriendRequest', () => {
  it('posts the user id to /v1/friends/requests', async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await sendFriendRequest('u2');
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/friends/requests', { method: 'POST', body: { userId: 'u2' } });
  });
});
