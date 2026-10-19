import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { getMyPosts } from '@/features/feed/feed-service';
import { useFeed } from '@/features/feed/use-feed';
import { useProfile } from '@/features/profile/use-profile';
import type { Post } from '@/lib/post/types';

import { ProfileScreen } from '../profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/feed/use-feed');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseFeed = jest.mocked(useFeed);
const push = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: 'Fern collector', avatarUrl: null };
const author = { id: 'u1', username: 'jane', bio: null, avatarUrl: null, friendship: null };
const myPosts: Post[] = [
  { id: 'p2', type: 'question', author, plantId: null, plantName: null, body: 'Why are my leaves red?', photoUrl: null, createdAt: '2026-10-19T10:00:00Z' },
  { id: 'p1', type: 'new_plant', author, plantId: 'plant1', plantName: 'Gus the Fern', body: null, photoUrl: null, createdAt: '2026-10-18T10:00:00Z' },
];

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockedUseProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry });
  mockedUseFeed.mockReturnValue({ posts: [], error: null, isLoading: false, retry });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ProfileScreen', () => {
  it("shows the signed-in user's username, email and bio", async () => {
    await render(<ProfileScreen />);

    expect(screen.getByText('jane')).toBeOnTheScreen();
    expect(screen.getByText('jane@example.com')).toBeOnTheScreen();
    expect(screen.getByText('Fern collector')).toBeOnTheScreen();
  });

  it("lists the user's own posts in the order they come, newest first", async () => {
    mockedUseFeed.mockReturnValue({ posts: myPosts, error: null, isLoading: false, retry });
    await render(<ProfileScreen />);

    expect(mockedUseFeed).toHaveBeenCalledWith(getMyPosts);
    const titles = screen.getAllByText(/Why are my leaves red\?|Gus the Fern/).map((node) => node.props.children);
    expect(titles).toEqual(['Why are my leaves red?', 'Gus the Fern']);
  });

  it('shows the error and retries when asked', async () => {
    mockedUseProfile.mockReturnValue({ user: null, error: 'User not found', isLoading: false, retry });
    await render(<ProfileScreen />);

    expect(screen.getByText('User not found')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });

  it('keeps friends, the watering calendar and settings in the burger menu', async () => {
    await render(<ProfileScreen />);
    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('button', { name: 'Close menu' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open friends' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open watering calendar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeOnTheScreen();
  });
});
