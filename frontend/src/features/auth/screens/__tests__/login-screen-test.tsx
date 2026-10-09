import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { useAuthActions } from '@/features/auth/use-auth-actions';
import { ApiError } from '@/lib/auth/api-client';

import { LoginScreen } from '../login-screen';

jest.mock('@/features/auth/use-auth-actions');

const mockedUseAuthActions = jest.mocked(useAuthActions);
const login = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseAuthActions.mockReturnValue({ login, register: jest.fn(), logout: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('LoginScreen', () => {
  it('submits the entered email and password', async () => {
    login.mockResolvedValue(undefined);
    await render(<LoginScreen />);

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ email: 'jane@example.com', password: 'password123' }),
    );
  });

  it('shows the backend-provided message when login is rejected', async () => {
    login.mockRejectedValue(new ApiError(401, 'irrelevant', { detail: 'Invalid credentials' }));
    await render(<LoginScreen />);

    await user.press(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByText('Invalid credentials');
  });

  it('falls back to a generic message when the backend sends no detail', async () => {
    login.mockRejectedValue(new ApiError(500, 'irrelevant'));
    await render(<LoginScreen />);

    await user.press(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByText('Something went wrong. Please try again.');
  });

  it('shows field-specific validation errors next to the right input', async () => {
    login.mockRejectedValue(new ApiError(400, 'irrelevant', { fieldErrors: { email: 'must be a well-formed email address' } }));
    await render(<LoginScreen />);

    await user.press(screen.getByRole('button', { name: 'Log in' }));

    await screen.findByText('must be a well-formed email address');
  });

  it('disables the submit button while the request is in flight', async () => {
    let resolveLogin: () => void = () => {};
    login.mockReturnValue(new Promise<void>((resolve) => (resolveLogin = resolve)));
    await render(<LoginScreen />);

    await user.press(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(screen.getByRole('button')).toBeDisabled());

    resolveLogin();
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
  });
});
