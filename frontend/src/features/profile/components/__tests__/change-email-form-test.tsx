import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { useProfileActions } from '@/features/profile/use-profile-actions';
import { ApiError } from '@/lib/auth/api-client';

import { ChangeEmailForm } from '../change-email-form';

jest.mock('@/features/profile/use-profile-actions');

const mockedUseProfileActions = jest.mocked(useProfileActions);
const changeEmail = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null };

beforeEach(() => {
  mockedUseProfileActions.mockReturnValue({ updateProfile: jest.fn(), changeEmail });
});

afterEach(() => {
  jest.resetAllMocks();
});

async function typeNewEmail(email: string) {
  await user.clear(screen.getByLabelText('Email'));
  await user.type(screen.getByLabelText('Email'), email);
}

describe('ChangeEmailForm', () => {

  it('sends the new email with the current password', async () => {
    changeEmail.mockResolvedValue({ ...jane, email: 'new@example.com' });
    await render(<ChangeEmailForm user={jane} />);

    await typeNewEmail('new@example.com');
    await user.type(screen.getByLabelText('Current password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Change email' }));

    await waitFor(() =>
      expect(changeEmail).toHaveBeenCalledWith({ email: 'new@example.com', currentPassword: 'password123' }),
    );
    await screen.findByText('Email changed');
    expect(screen.queryByLabelText('Current password')).toBeNull();
  });

  it('shows a wrong current password next to the password field', async () => {
    changeEmail.mockRejectedValue(new ApiError(403, 'irrelevant', { detail: 'Current password is incorrect' }));
    await render(<ChangeEmailForm user={jane} />);

    await typeNewEmail('new@example.com');
    await user.type(screen.getByLabelText('Current password'), 'wrong');
    await user.press(screen.getByRole('button', { name: 'Change email' }));

    await screen.findByText('Current password is incorrect');
  });
});
