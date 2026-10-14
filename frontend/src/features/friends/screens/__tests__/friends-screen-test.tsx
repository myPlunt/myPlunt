import { render, screen, userEvent } from '@testing-library/react-native';

import { sendFriendRequest } from '@/features/friends/friends-service';
import { useUserSearch } from '@/features/friends/use-user-search';
import { ApiError } from '@/lib/auth/api-client';
import { AuthStoreProvider } from '@/stores/auth-store';

import { FriendsScreen } from '../friends-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/friends/use-user-search');
jest.mock('@/features/friends/friends-service');

const mockedUseUserSearch = jest.mocked(useUserSearch);
const mockedSendFriendRequest = jest.mocked(sendFriendRequest);
const user = userEvent.setup();
const jane = {
  id: 'u2',
  username: 'jane_doe',
  bio: 'Fern collector',
  avatarUrl: 'https://storage.test/jane.jpg',
  friendship: null,
} as const;

beforeEach(() => {
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

it('sends a friend request and then shows it as requested', async () => {
  mockedUseUserSearch.mockReturnValue({ users: [jane], error: null, isLoading: false });
  mockedSendFriendRequest.mockResolvedValue();
  await search('jan');

  await user.press(screen.getByLabelText('Add jane_doe'));

  expect(mockedSendFriendRequest).toHaveBeenCalledWith('u2');
  expect(screen.getByText('Requested')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Add jane_doe')).toBeNull();
});

it('shows why a friend request failed and keeps the Add button', async () => {
  mockedUseUserSearch.mockReturnValue({ users: [jane], error: null, isLoading: false });
  mockedSendFriendRequest.mockRejectedValue(new ApiError(409, 'conflict', { detail: 'Request already sent' }));
  await search('jan');

  await user.press(screen.getByLabelText('Add jane_doe'));

  expect(screen.getByText('Request already sent')).toBeOnTheScreen();
  expect(screen.getByLabelText('Add jane_doe')).toBeOnTheScreen();
});

it.each([
  ['friends', 'Friends'],
  ['request_sent', 'Requested'],
  ['request_received', 'Sent you a request'],
] as const)('shows %s people as "%s" instead of an Add button', async (friendship, label) => {
  mockedUseUserSearch.mockReturnValue({ users: [{ ...jane, friendship }], error: null, isLoading: false });
  await search('jan');

  expect(screen.getByText(label)).toBeOnTheScreen();
  expect(screen.queryByLabelText('Add jane_doe')).toBeNull();
});
