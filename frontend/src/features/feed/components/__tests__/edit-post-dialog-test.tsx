import { render, screen, userEvent } from '@testing-library/react-native';

import { useFeedActions } from '@/features/feed/use-feed-actions';
import { ApiError } from '@/lib/auth/api-client';
import type { PlantPost, QuestionPost } from '@/lib/post/types';

import { EditPostDialog } from '../edit-post-dialog';

jest.mock('@/features/feed/use-feed-actions');

const user = userEvent.setup();
const updatePost = jest.fn();
const deletePost = jest.fn();
const onClose = jest.fn();
const onSaved = jest.fn();
const onDeleted = jest.fn();

const author = { id: 'u1', username: 'jane', bio: null, avatarUrl: null, friendship: null };
const question: QuestionPost = {
  id: 'q1',
  type: 'question',
  author,
  plantId: null,
  plantName: null,
  body: 'Why are my leaves red?',
  photoUrl: null,
  commentCount: 0,
  waterCount: 0,
  wateredByMe: false,
  createdAt: '2026-10-19T10:00:00Z',
};
const photoPost: PlantPost = {
  id: 'ph1',
  type: 'new_photo',
  author,
  plantId: 'plant1',
  plantName: 'Gus the Fern',
  body: 'A new flower is blooming!',
  photoUrl: null,
  commentCount: 0,
  waterCount: 0,
  wateredByMe: false,
  createdAt: '2026-10-19T10:00:00Z',
};

beforeEach(() => {
  jest.mocked(useFeedActions).mockReturnValue({
    askQuestion: jest.fn(),
    updatePost,
    deletePost,
    addComment: jest.fn(),
    waterPost: jest.fn(),
    unwaterPost: jest.fn(),
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('EditPostDialog', () => {
  it("saves the question's new text, trimmed", async () => {
    updatePost.mockResolvedValue({ ...question, body: 'Why are they yellow?' });
    await render(<EditPostDialog post={question} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />);

    await user.clear(screen.getByLabelText('Question'));
    await user.type(screen.getByLabelText('Question'), ' Why are they yellow? ');
    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(updatePost).toHaveBeenCalledWith('q1', { body: 'Why are they yellow?' });
    expect(onSaved).toHaveBeenCalledWith({ ...question, body: 'Why are they yellow?' });
  });

  it("removes a new photo's comment when it's cleared, and shows the backend's field error", async () => {
    updatePost.mockRejectedValue(
      new ApiError(400, 'Bad Request', { detail: 'Invalid', fieldErrors: { body: 'Text must be at most 280 characters.' } }),
    );
    await render(<EditPostDialog post={photoPost} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />);

    await user.clear(screen.getByLabelText('Comment (optional)'));
    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(updatePost).toHaveBeenCalledWith('ph1', { body: null });
    expect(await screen.findByText('Text must be at most 280 characters.')).toBeOnTheScreen();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('deletes the post only after the user confirms', async () => {
    deletePost.mockResolvedValue(undefined);
    await render(<EditPostDialog post={photoPost} onClose={onClose} onSaved={onSaved} onDeleted={onDeleted} />);

    await user.press(screen.getByRole('button', { name: 'Delete post' }));
    expect(deletePost).not.toHaveBeenCalled();
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(deletePost).toHaveBeenCalledWith('ph1');
    expect(onDeleted).toHaveBeenCalled();
  });
});
