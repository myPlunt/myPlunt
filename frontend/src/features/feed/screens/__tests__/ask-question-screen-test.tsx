import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useFeedActions } from '@/features/feed/use-feed-actions';
import { usePhotoUpload, type PhotoUpload } from '@/features/photos/use-photo-upload';
import { ApiError } from '@/lib/auth/api-client';

import { AskQuestionScreen } from '../ask-question-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/feed/use-feed-actions');
jest.mock('@/features/photos/use-photo-upload');

const back = jest.fn();
const askQuestion = jest.fn();
const user = userEvent.setup();

function mockPhoto(state: Partial<PhotoUpload>) {
  jest.mocked(usePhotoUpload).mockReturnValue({
    uri: null,
    key: null,
    takenAt: null,
    isUploading: false,
    error: null,
    takePhoto: jest.fn(),
    chooseFromLibrary: jest.fn(),
    uploadLibraryPhoto: jest.fn(),
    remove: jest.fn(),
    ...state,
  });
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ back, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useFeedActions).mockReturnValue({ askQuestion, updatePost: jest.fn(), deletePost: jest.fn(), addComment: jest.fn() });
  askQuestion.mockResolvedValue({});
  mockPhoto({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AskQuestionScreen', () => {
  it('asks the question with its photo, then goes back to the feed', async () => {
    mockPhoto({ uri: 'file:///leaves.jpg', key: 'posts/u/leaves.jpg' });
    await render(<AskQuestionScreen />);

    await user.type(screen.getByLabelText('Your question'), 'Why are my leaves red?');
    await user.press(screen.getByRole('button', { name: 'Stick it on the vine' }));

    expect(askQuestion).toHaveBeenCalledWith({ body: 'Why are my leaves red?', photoKey: 'posts/u/leaves.jpg' });
    expect(back).toHaveBeenCalled();
  });

  it("can't be posted without a question", async () => {
    await render(<AskQuestionScreen />);

    expect(screen.getByRole('button', { name: 'Stick it on the vine' })).toBeDisabled();
  });

  it('shows the error from the backend and stays open', async () => {
    askQuestion.mockRejectedValue(new ApiError(400, 'Bad Request', { detail: "That photo can't be added to a question." }));
    await render(<AskQuestionScreen />);

    await user.type(screen.getByLabelText('Your question'), 'Why?');
    await user.press(screen.getByRole('button', { name: 'Stick it on the vine' }));

    expect(await screen.findByText("That photo can't be added to a question.")).toBeOnTheScreen();
    expect(back).not.toHaveBeenCalled();
  });
});
