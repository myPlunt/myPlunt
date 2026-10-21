import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useFeedActions } from '@/features/feed/use-feed-actions';
import { usePost } from '@/features/feed/use-post';
import type { QuestionPost } from '@/lib/post/types';

import { PostScreen } from '../post-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/feed/use-post');
jest.mock('@/features/feed/use-feed-actions');

const user = userEvent.setup();
const back = jest.fn();
const push = jest.fn();
const deletePost = jest.fn();

function question(friendship: QuestionPost['author']['friendship']): QuestionPost {
  return {
    id: 'q1',
    type: 'question',
    author: { id: 'u1', username: 'emma', bio: null, avatarUrl: null, friendship },
    plantId: null,
    plantName: null,
    body: 'Why are my leaves red?',
    photoUrl: null,
    createdAt: '2026-10-19T10:00:00Z',
  };
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ back, push, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useFeedActions).mockReturnValue({ askQuestion: jest.fn(), updatePost: jest.fn(), deletePost });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PostScreen', () => {
  it("has no pencil on a friend's post", async () => {
    jest.mocked(usePost).mockReturnValue({ post: question('friends'), error: null, isLoading: false, retry: jest.fn() });
    await render(<PostScreen postId="q1" />);

    expect(screen.getByText('Why are my leaves red?')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Edit post' })).toBeNull();
  });

  it("opens the friend's profile from their picture", async () => {
    jest.mocked(usePost).mockReturnValue({ post: question('friends'), error: null, isLoading: false, retry: jest.fn() });
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: "Open emma's profile" }));

    expect(push).toHaveBeenCalledWith({ pathname: '/user/[id]', params: { id: 'u1' } });
  });

  it("deletes the user's own post from the pencil and leaves the page", async () => {
    jest.mocked(usePost).mockReturnValue({ post: question(null), error: null, isLoading: false, retry: jest.fn() });
    deletePost.mockResolvedValue(undefined);
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: 'Edit post' }));
    await user.press(screen.getByRole('button', { name: 'Delete post' }));
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(deletePost).toHaveBeenCalledWith('q1');
    expect(back).toHaveBeenCalled();
  });
});
