import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useUserSearch } from '@/features/friends/use-user-search';

import { FriendsScreen } from '../friends-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/friends/use-user-search');

const mockedUseUserSearch = jest.mocked(useUserSearch);
const mockedUseRouter = jest.mocked(useRouter);
const push = jest.fn();
const user = userEvent.setup();
const jane = {
  id: 'u2',
  username: 'jane_doe',
  bio: 'Fern collector',
  avatarUrl: 'https://storage.test/jane.jpg',
  friendship: null,
} as const;

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockedUseUserSearch.mockReturnValue({ users: null, error: null, isLoading: false });
});

afterEach(() => {
  jest.resetAllMocks();
});

async function search(query: string) {
  await render(<FriendsScreen />);
  await user.type(screen.getByLabelText('Search people'), query);
}

it('lists the people found, with their picture and bio', async () => {
  mockedUseUserSearch.mockReturnValue({ users: [jane], error: null, isLoading: false });
  await search('jan');

  expect(mockedUseUserSearch).toHaveBeenLastCalledWith('jan');
  expect(screen.getByText('jane_doe')).toBeOnTheScreen();
  expect(screen.getByText('Fern collector')).toBeOnTheScreen();
  expect(screen.getByLabelText("jane_doe's profile picture")).toBeOnTheScreen();
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
