import { act, fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useFeedActions } from '@/features/feed/use-feed-actions';
import { usePost } from '@/features/feed/use-post';
import { ApiError } from '@/lib/auth/api-client';
import type { Post, PostComment, QuestionPost } from '@/lib/post/types';

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
const refresh = jest.fn();
const waterPost = jest.fn();

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
    waterCount: 0,
    wateredByMe: false,
    createdAt: '2026-10-19T10:00:00Z',
  };
}

function loaded(post: Post, comments: PostComment[] = []) {
  return { post, comments, addLocalComment, error: null, isLoading: false, isRefreshing: false, refresh, retry: jest.fn() };
}

const comment: PostComment = {
  id: 'c1',
  author: { id: 'u2', username: 'tom', bio: null, avatarUrl: null, friendship: null },
  body: 'Too much sun, I think',
  createdAt: '2026-10-20T10:00:00Z',
};

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ back, push, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useFeedActions).mockReturnValue({
    askQuestion: jest.fn(),
    updatePost: jest.fn(),
    deletePost,
    addComment,
    waterPost,
    unwaterPost: jest.fn(),
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PostScreen', () => {
  it("has no post menu on a friend's post", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends')));
    await render(<PostScreen postId="q1" />);

    expect(screen.getByText('Why are my leaves red?')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull();
  });

  it("opens the friend's profile from their picture", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends')));
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: "Open emma's profile" }));

    expect(push).toHaveBeenCalledWith({ pathname: '/user/[id]', params: { id: 'u1' } });
  });

  it("deletes the user's own post from the menu's bin and leaves the page", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question(null)));
    deletePost.mockResolvedValue(undefined);
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Edit post' })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Delete post' }));
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(deletePost).toHaveBeenCalledWith('q1');
    expect(back).toHaveBeenCalled();
  });

  it('offers only the bin on a new plant post, which has no words to edit', async () => {
    jest.mocked(usePost).mockReturnValue(
      loaded({ ...question(null), type: 'new_plant', plantId: 'p1', plantName: 'Gus the Fern', body: null }),
    );
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('button', { name: 'Delete post' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Edit post' })).toBeNull();
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

  it("waters a friend's post straight away and takes the drop back when it fails", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends')));
    let fail: (err: unknown) => void = () => {};
    waterPost.mockReturnValue(new Promise((_, reject) => (fail = reject)));
    await render(<PostScreen postId="q1" />);

    await user.press(screen.getByRole('button', { name: 'Water this post' }));

    expect(waterPost).toHaveBeenCalledWith('q1');
    expect(screen.getByRole('button', { name: 'Take your water back' })).toHaveAccessibilityValue({ text: '1 drop' });
    await act(async () => fail(new ApiError(404, 'Not Found', { detail: 'Post not found' })));
    expect(screen.getByRole('button', { name: 'Water this post' })).toHaveAccessibilityValue({ text: '0 drops' });
  });

  it("only shows the drops on the user's own post", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question(null)));
    await render(<PostScreen postId="q1" />);

    expect(screen.getByLabelText('0 drops')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Water this post' })).toBeNull();
  });

  it("waters a friend's question when its note is tapped twice, even without a photo", async () => {
    jest.mocked(usePost).mockReturnValue(loaded(question('friends')));
    waterPost.mockResolvedValue(undefined);
    await render(<PostScreen postId="q1" />);

    const note = screen.getByText('Why are my leaves red?');
    await fireEvent.press(note);
    await fireEvent.press(note);

    expect(waterPost).toHaveBeenCalledWith('q1');
    expect(screen.getByRole('button', { name: 'Take your water back' })).toHaveAccessibilityValue({ text: '1 drop' });
  });
});
