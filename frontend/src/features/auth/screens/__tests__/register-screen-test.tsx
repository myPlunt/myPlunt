import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { useAuthActions } from '@/features/auth/use-auth-actions';
import { ApiError } from '@/lib/auth/api-client';

import { RegisterScreen } from '../register-screen';

jest.mock('@/features/auth/use-auth-actions');

const mockedUseAuthActions = jest.mocked(useAuthActions);
const register = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseAuthActions.mockReturnValue({ login: jest.fn(), register, logout: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('RegisterScreen', () => {
  it('submits the entered username, email and password', async () => {
    register.mockResolvedValue(undefined);
    await render(<RegisterScreen />);

    await user.type(screen.getByLabelText('Username'), 'jane');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        username: 'jane',
        email: 'jane@example.com',
        password: 'password123',
      }),
    );
  });

  it('shows a conflict message when the email or username is already taken', async () => {
    register.mockRejectedValue(new ApiError(409, 'irrelevant'));
    await render(<RegisterScreen />);

    await user.press(screen.getByRole('button', { name: 'Create account' }));

    await screen.findByText('That email or username is already taken.');
  });

  it('shows a validation message on a 400', async () => {
    register.mockRejectedValue(new ApiError(400, 'irrelevant'));
    await render(<RegisterScreen />);

    await user.press(screen.getByRole('button', { name: 'Create account' }));

    await screen.findByText('Check your details: password must be at least 8 characters.');
  });
});
