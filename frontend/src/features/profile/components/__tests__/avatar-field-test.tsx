import { act, render, screen, userEvent } from '@testing-library/react-native';

import { usePhotoUpload, type PhotoUpload } from '@/features/photos/use-photo-upload';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { ApiError } from '@/lib/auth/api-client';

import { AvatarField } from '../avatar-field';

jest.mock('@/features/photos/use-photo-upload');
jest.mock('@/features/profile/use-profile-actions');
// The menu reads the photo library; these tests only need the field itself.
jest.mock('@/features/plants/components/photo-menu', () => ({ PhotoMenu: () => null }));

const mockedUsePhotoUpload = jest.mocked(usePhotoUpload);
const mockedUseProfileActions = jest.mocked(useProfileActions);
const updateAvatar = jest.fn();
const removeAvatar = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null, avatarUrl: 'https://storage/old.jpg', onboardingCompleted: true };
const noPhoto: PhotoUpload = {
  uri: null,
  key: null,
  isUploading: false,
  error: null,
  takenAt: null,
  takePhoto: jest.fn(),
  chooseFromLibrary: jest.fn(),
  uploadLibraryPhoto: jest.fn(),
  remove: jest.fn(),
};

beforeEach(() => {
  mockedUsePhotoUpload.mockReturnValue(noPhoto);
  mockedUseProfileActions.mockReturnValue({ updateProfile: jest.fn(), changeEmail: jest.fn(), updateAvatar, removeAvatar });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AvatarField', () => {
  it('saves an uploaded photo as the profile picture straight away', async () => {
    updateAvatar.mockResolvedValue({ ...jane, avatarUrl: 'https://storage/new.jpg' });
    await render(<AvatarField user={{ ...jane, avatarUrl: null }} />);
    const [category, onUploaded] = mockedUsePhotoUpload.mock.calls[0];

    await act(() => onUploaded!('avatars/u1/new.jpg'));

    expect(category).toBe('AVATAR');
    expect(updateAvatar).toHaveBeenCalledWith({ key: 'avatars/u1/new.jpg' });
    expect(screen.getByRole('button', { name: 'Change profile picture' })).toBeOnTheScreen();
  });

  it('removes the picture', async () => {
    removeAvatar.mockResolvedValue(undefined);
    await render(<AvatarField user={jane} />);

    await user.press(screen.getByRole('button', { name: 'Remove picture' }));

    expect(removeAvatar).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Remove picture' })).not.toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add a profile picture' })).toBeOnTheScreen();
  });

  it('keeps the picture and shows why when removing fails', async () => {
    removeAvatar.mockRejectedValue(new ApiError(500, 'Server error', { detail: 'Something went wrong.' }));
    await render(<AvatarField user={jane} />);

    await user.press(screen.getByRole('button', { name: 'Remove picture' }));

    expect(await screen.findByText('Something went wrong.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Remove picture' })).toBeOnTheScreen();
  });
});
