import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { acceptFriendRequest } from '@/features/friends/friends-service';
import { useFriends } from '@/features/friends/use-friends';
import { useUserSearch } from '@/features/friends/use-user-search';
import { AuthStoreProvider } from '@/stores/auth-store';

import { FriendsScreen } from '../friends-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/friends/use-user-search');
jest.mock('@/features/friends/use-friends');
jest.mock('@/features/friends/friends-service');

const mockedUseUserSearch = jest.mocked(useUserSearch);
const mockedUseFriends = jest.mocked(useFriends);
const mockedAcceptFriendRequest = jest.mocked(acceptFriendRequest);
const mockedUseRouter = jest.mocked(useRouter);
const retry = jest.fn();
const reload = jest.fn();
const push = jest.fn();
const user = userEvent.setup();
const jane = {
  id: 'u2',
  username: 'jane_doe',
  bio: 'Fern collector',
  avatarUrl: 'https://storage.test/jane.jpg',
  friendship: null,
} as const;
const tom = { ...jane, id: 'u3', username: 'tom', bio: null, friendship: 'friends' } as const;
const sam = { ...jane, id: 'u4', username: 'sam', bio: null, friendship: 'request_received' } as const;
const mia = { ...jane, id: 'u5', username: 'mia', bio: null, friendship: 'request_sent' } as const;

function friendsState(state: Partial<ReturnType<typeof useFriends>>) {
  mockedUseFriends.mockReturnValue({
    friends: [tom],
    requests: { received: [sam], sent: [mia] },
    error: null,
    isLoading: false,
    retry,
    reload,
    ...state,
  });
}

async function openTab(name: RegExp) {
  await render(<FriendsScreen />, { wrapper: AuthStoreProvider });
  await user.press(screen.getByRole('tab', { name }));
}

beforeEach(() => {
  friendsState({});
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockedUseUserSearch.mockReturnValue({ users: null, error: null, isLoading: false });
});

afterEach(() => {
  jest.resetAllMocks();
});

async function search(query: string) {
  await render(<FriendsScreen />, { wrapper: AuthStoreProvider });
  await user.type(screen.getByLabelText('Search people'), query);
}

it('explains what to search for before anything is typed', async () => {
  await render(<FriendsScreen />, { wrapper: AuthStoreProvider });

  expect(screen.getByText('Find friends by their username')).toBeOnTheScreen();
});

it('lists the people found, with their picture and bio', async () => {
  mockedUseUserSearch.mockReturnValue({ users: [jane], error: null, isLoading: false });
  await search('jan');

  expect(mockedUseUserSearch).toHaveBeenLastCalledWith('jan');
  expect(screen.getByText('jane_doe')).toBeOnTheScreen();
  expect(screen.getByText('Fern collector')).toBeOnTheScreen();
  expect(screen.getByLabelText("jane_doe's profile picture")).toBeOnTheScreen();
});

it('keeps the previous results on screen while the next search loads', async () => {
  mockedUseUserSearch.mockReturnValue({ users: [jane], error: null, isLoading: true });
  await search('jane');

  expect(screen.getByText('jane_doe')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Searching people')).toBeNull();
});

it('shows a spinner while the first results load', async () => {
  mockedUseUserSearch.mockReturnValue({ users: null, error: null, isLoading: true });
  await search('jan');

  expect(screen.getByLabelText('Searching people')).toBeOnTheScreen();
});

it('says so when no one matches', async () => {
  mockedUseUserSearch.mockReturnValue({ users: [], error: null, isLoading: false });
  await search('zz');

  expect(screen.getByText('No one matches “zz”')).toBeOnTheScreen();
});

it('shows the error when the search fails', async () => {
  mockedUseUserSearch.mockReturnValue({ users: null, error: 'Offline', isLoading: false });
  await search('jan');

  expect(screen.getByText('Offline')).toBeOnTheScreen();
});

it("opens a person's profile when they're pressed", async () => {
  mockedUseUserSearch.mockReturnValue({ users: [jane], error: null, isLoading: false });
  await search('jan');

  await user.press(screen.getByRole('button', { name: 'jane_doe' }));

  expect(push).toHaveBeenCalledWith({ pathname: '/user/[id]', params: { id: 'u2' } });
});

it('tags people who are already friends, and only them', async () => {
  const tom = { ...jane, id: 'u3', username: 'tom', friendship: 'friends' } as const;
  const mia = { ...jane, id: 'u4', username: 'mia', friendship: 'request_sent' } as const;
  mockedUseUserSearch.mockReturnValue({ users: [jane, tom, mia], error: null, isLoading: false });
  await search('a');

  expect(screen.getAllByText('Friend')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'tom' })).toHaveTextContent(/Friend/);
});

it('opens on Find, with the number of requests waiting on the Requests tab', async () => {
  await render(<FriendsScreen />, { wrapper: AuthStoreProvider });

  expect(screen.getByRole('tab', { name: 'Find' })).toBeSelected();
  expect(screen.getByRole('tab', { name: 'Requests, 1 waiting' })).toBeOnTheScreen();
});

it('shows no badge when no requests are waiting', async () => {
  friendsState({ requests: { received: [], sent: [mia] } });
  await render(<FriendsScreen />, { wrapper: AuthStoreProvider });

  expect(screen.getByRole('tab', { name: 'Requests' })).toBeOnTheScreen();
});

it('lists friends on the Friends tab and opens their profile', async () => {
  await openTab(/^Friends/);

  expect(screen.getByRole('tab', { name: 'Friends' })).toBeSelected();
  await user.press(screen.getByRole('button', { name: 'tom' }));
  expect(push).toHaveBeenCalledWith({ pathname: '/user/[id]', params: { id: 'u3' } });
});

it('says when there are no friends yet', async () => {
  friendsState({ friends: [] });
  await openTab(/^Friends/);

  expect(screen.getByText('No friends yet. Find people in the Find tab.')).toBeOnTheScreen();
});

it('lists received requests with Accept and Decline, and sent ones as Requested', async () => {
  await openTab(/^Requests/);

  expect(screen.getByText('RECEIVED')).toBeOnTheScreen();
  expect(screen.getByText('sam')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Accept' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Decline' })).toBeOnTheScreen();
  expect(screen.getByText('SENT')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'mia' })).toHaveTextContent(/Requested/);
});

it('reloads the lists after a request is answered', async () => {
  mockedAcceptFriendRequest.mockResolvedValue();
  await openTab(/^Requests/);

  await user.press(screen.getByRole('button', { name: 'Accept' }));

  expect(mockedAcceptFriendRequest).toHaveBeenCalledWith('u4');
  expect(reload).toHaveBeenCalled();
});

it('says when there are no requests', async () => {
  friendsState({ requests: { received: [], sent: [] } });
  await openTab(/^Requests/);

  expect(screen.getByText('No friend requests')).toBeOnTheScreen();
});

it('shows a spinner while friends and requests load', async () => {
  friendsState({ friends: null, requests: null, isLoading: true });
  await openTab(/^Requests/);

  expect(screen.getByLabelText('Loading requests')).toBeOnTheScreen();
});

it('shows the error with a way to try again', async () => {
  friendsState({ friends: null, requests: null, error: 'Offline' });
  await openTab(/^Friends/);

  expect(screen.getByText('Offline')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalled();
});

it('keeps the search when switching tabs and back', async () => {
  await search('jan');
  await user.press(screen.getByRole('tab', { name: /^Friends/ }));
  await user.press(screen.getByRole('tab', { name: 'Find' }));

  expect(screen.getByLabelText('Search people')).toHaveDisplayValue('jan');
});
