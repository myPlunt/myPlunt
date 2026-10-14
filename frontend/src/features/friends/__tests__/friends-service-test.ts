import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  getUser,
  searchUsers,
  sendFriendRequest,
} from '@/features/friends/friends-service';
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

describe('getUser', () => {
  it('fetches /v1/users/{id}', async () => {
    const jane = { id: 'u2', username: 'jane_doe', bio: null, avatarUrl: null, friendship: null };
    mockedApiFetch.mockResolvedValue(jane);

    await expect(getUser('u2')).resolves.toEqual(jane);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/u2');
  });
});

describe('sendFriendRequest', () => {
  it('posts the user id to /v1/friends/requests', async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await sendFriendRequest('u2');
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/friends/requests', { method: 'POST', body: { userId: 'u2' } });
  });
});

describe('friends and requests', () => {
  it('fetches the friends list and the pending requests', async () => {
    mockedApiFetch.mockResolvedValue([]);

    await getFriends();
    await getFriendRequests();
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/friends');
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/friends/requests');
  });

  it("accepts and declines by the sender's id", async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await acceptFriendRequest('u4');
    await declineFriendRequest('u4');
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/friends/requests/u4/accept', { method: 'POST' });
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/friends/requests/u4/decline', { method: 'POST' });
  });
});
