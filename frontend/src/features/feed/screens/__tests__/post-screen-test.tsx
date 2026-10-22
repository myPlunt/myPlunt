import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useFeedActions } from '@/features/feed/use-feed-actions';
import { usePost } from '@/features/feed/use-post';
import { ApiError } from '@/lib/auth/api-client';
import type { PostComment, QuestionPost } from '@/lib/post/types';

import { PostScreen } from '../post-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/feed/use-post');
jest.mock('@/features/feed/use-feed-actions');

const user = userEvent.setup();
const back = jest.fn();
const push = jest.fn();
const deletePost = jest.fn();
const addComment = jest.fn();
const addLocalComment = jest.fn();

function question(friendship: QuestionPost['author']['friendship']): QuestionPost {
  return {
    id: 'q1',
    type: 'question',
    author: { id: 'u1', username: 'emma', bio: null, avatarUrl: null, friendship },
    plantId: null,
    plantName: null,
    body: 'Why are my leaves red?',
    photoUrl: null,
    commentCount: 0,
    createdAt: '2026-10-19T10:00:00Z',
  };
}

function loaded(post: QuestionPost, comments: PostComment[] = []) {
  return { post, comments, addLocalComment, error: null, isLoading: false, retry: jest.fn() };
}

const comment: PostComment = {
  id: 'c1',
  author: { id: 'u2', username: 'tom', bio: null, avatarUrl: null, friendship: null },
  body: 'Too much sun, I think',
  createdAt: '2026-10-20T10:00:00Z',
};

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ back, push, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useFeedActions).mockReturnValue({ askQuestion: jest.fn(), updatePost: jest.fn(), deletePost, addComment });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PostScreen', () => {
  it("has no pencil on a friend's post", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends')));
    await render(<PostScreen postId="q1" />);

    expect(screen.getByText('Why are my leaves red?')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Edit post' })).toBeNull();
  });

  it("opens the friend's profile from their picture", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends')));
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: "Open emma's profile" }));

    expect(push).toHaveBeenCalledWith({ pathname: '/user/[id]', params: { id: 'u1' } });
  });

  it("deletes the user's own post from the pencil and leaves the page", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question(null)));
    deletePost.mockResolvedValue(undefined);
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: 'Edit post' }));
    await user.press(screen.getByRole('button', { name: 'Delete post' }));
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(deletePost).toHaveBeenCalledWith('q1');
    expect(back).toHaveBeenCalled();
  });

  it('sends a comment and shows it under the post', async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends')));
    addComment.mockResolvedValue(comment);
    await render(<PostScreen postId="q1" />);

    await user.type(screen.getByLabelText('Add a comment'), '  Too much sun, I think ');
    await user.press(screen.getByRole('button', { name: 'Send' }));

    expect(addComment).toHaveBeenCalledWith('q1', { body: 'Too much sun, I think' });
    expect(addLocalComment).toHaveBeenCalledWith(comment);
    expect(screen.getByLabelText('Add a comment')).toHaveDisplayValue('');
  });

  it('lists the comments and keeps the text when sending fails', async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends'), [comment]));
    addComment.mockRejectedValue(new ApiError(404, 'Not Found', { detail: 'Post not found' }));
    await render(<PostScreen postId="q1" />);

    expect(screen.getByText('Too much sun, I think')).toBeOnTheScreen();
    await user.type(screen.getByLabelText('Add a comment'), 'Me too');
    await user.press(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Post not found')).toBeOnTheScreen();
    expect(addLocalComment).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Add a comment')).toHaveDisplayValue('Me too');
  });
});
