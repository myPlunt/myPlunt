import { render, screen, userEvent } from '@testing-library/react-native';

import { useUserSearch } from '@/features/friends/use-user-search';

import { FriendsScreen } from '../friends-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/friends/use-user-search');

const mockedUseUserSearch = jest.mocked(useUserSearch);
const user = userEvent.setup();
const jane = { id: 'u2', username: 'jane_doe', bio: 'Fern collector', avatarUrl: 'https://storage.test/jane.jpg' };

beforeEach(() => {
  mockedUseUserSearch.mockReturnValue({ users: null, error: null, isLoading: false });
});

afterEach(() => {
  jest.resetAllMocks();
});

async function search(query: string) {
  await render(<FriendsScreen />);
  await user.type(screen.getByLabelText('Search people'), query);
}

it('explains what to search for before anything is typed', async () => {
  await render(<FriendsScreen />);

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
