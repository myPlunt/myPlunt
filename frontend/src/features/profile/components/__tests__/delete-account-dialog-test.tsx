import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { useAuthActions } from '@/features/auth/use-auth-actions';
import { ApiError } from '@/lib/auth/api-client';

import { DeleteAccountDialog } from '../delete-account-dialog';

jest.mock('@/features/auth/use-auth-actions');

const mockedUseAuthActions = jest.mocked(useAuthActions);
const deleteAccount = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseAuthActions.mockReturnValue({ login: jest.fn(), register: jest.fn(), logout: jest.fn(), deleteAccount });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('DeleteAccountDialog', () => {
  it('only deletes once the password is typed, and sends it', async () => {
    deleteAccount.mockResolvedValue(undefined);
    await render(<DeleteAccountDialog onClose={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Delete account' })).toBeDisabled();
    await user.type(screen.getByLabelText('Current password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Delete account' }));

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith({ currentPassword: 'password123' }));
  });

  it('shows a wrong password next to the field and stays open', async () => {
    deleteAccount.mockRejectedValue(new ApiError(403, 'irrelevant', { detail: 'Current password is incorrect' }));
    const onClose = jest.fn();
    await render(<DeleteAccountDialog onClose={onClose} />);

    await user.type(screen.getByLabelText('Current password'), 'wrong');
    await user.press(screen.getByRole('button', { name: 'Delete account' }));

    await screen.findByText('Current password is incorrect');
    expect(onClose).not.toHaveBeenCalled();
  });
});
