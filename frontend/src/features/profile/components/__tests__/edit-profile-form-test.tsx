import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { useProfileActions } from '@/features/profile/use-profile-actions';
import { ApiError } from '@/lib/auth/api-client';

import { EditProfileForm } from '../edit-profile-form';

jest.mock('@/features/profile/use-profile-actions');

const mockedUseProfileActions = jest.mocked(useProfileActions);
const updateProfile = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: 'Fern collector' };

beforeEach(() => {
  mockedUseProfileActions.mockReturnValue({ updateProfile, changeEmail: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('EditProfileForm', () => {
  it('starts with the current username and bio filled in, and no email field', async () => {
    await render(<EditProfileForm user={jane} />);

    expect(screen.getByLabelText('Username')).toHaveDisplayValue('jane');
    expect(screen.getByLabelText('Bio')).toHaveDisplayValue('Fern collector');
    expect(screen.queryByLabelText('Email')).toBeNull();
  });

  it('keeps Save disabled until something changes', async () => {
    await render(<EditProfileForm user={jane} />);

    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateProfile).not.toHaveBeenCalled();
  });

  it('saves a new username and bio', async () => {
    updateProfile.mockResolvedValue({ ...jane, username: 'janey', bio: 'Cactus fan' });
    await render(<EditProfileForm user={jane} />);

    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'janey');
    await user.clear(screen.getByLabelText('Bio'));
    await user.type(screen.getByLabelText('Bio'), 'Cactus fan');
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ username: 'janey', bio: 'Cactus fan' }));
    await screen.findByText('Profile saved');
  });

  it('sends an emptied bio as null', async () => {
    updateProfile.mockResolvedValue({ ...jane, bio: null });
    await render(<EditProfileForm user={jane} />);

    await user.clear(screen.getByLabelText('Bio'));
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ username: 'jane', bio: null }));
  });

  it('shows field-specific validation errors next to the right input', async () => {
    updateProfile.mockRejectedValue(
      new ApiError(400, 'irrelevant', { fieldErrors: { username: 'Username must not be blank.' } }),
    );
    await render(<EditProfileForm user={jane} />);

    await user.clear(screen.getByLabelText('Username'));
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('Username must not be blank.');
  });

  it('shows the backend message for other errors', async () => {
    updateProfile.mockRejectedValue(new ApiError(409, 'irrelevant', { detail: 'Username already taken' }));
    await render(<EditProfileForm user={jane} />);

    await user.clear(screen.getByLabelText('Username'));
    await user.type(screen.getByLabelText('Username'), 'taken');
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByText('Username already taken');
  });
});
