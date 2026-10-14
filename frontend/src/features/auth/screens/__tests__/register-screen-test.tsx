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

  it('shows the backend-provided message distinguishing email vs username conflicts', async () => {
    const error = new ApiError(409, 'irrelevant', { detail: 'Username already taken' });
    register.mockRejectedValue(error);
    await render(<RegisterScreen />);

    await user.press(screen.getByRole('button', { name: 'Create account' }));

    await screen.findByText('Username already taken');
  });

  it('shows field-specific validation errors next to the right input', async () => {
    register.mockRejectedValue(
      new ApiError(400, 'irrelevant', {
        fieldErrors: { email: 'must be a well-formed email address' },
      }),
    );
    await render(<RegisterScreen />);

    await user.press(screen.getByRole('button', { name: 'Create account' }));

    await screen.findByText('must be a well-formed email address');
  });
});
