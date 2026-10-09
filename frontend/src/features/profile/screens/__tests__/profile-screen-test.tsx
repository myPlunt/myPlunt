import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useAuthActions } from '@/features/auth/use-auth-actions';
import { useProfile } from '@/features/profile/use-profile';

import { ProfileScreen } from '../profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/auth/use-auth-actions');
jest.mock('@/features/profile/use-profile');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuthActions = jest.mocked(useAuthActions);
const mockedUseProfile = jest.mocked(useProfile);
const dismissTo = jest.fn();
const logout = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ dismissTo } as unknown as ReturnType<typeof useRouter>);
  mockedUseAuthActions.mockReturnValue({ login: jest.fn(), register: jest.fn(), logout });
  mockedUseProfile.mockReturnValue({
    user: { id: 'u1', username: 'jane', email: 'jane@example.com' },
    error: null,
    isLoading: false,
    retry,
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ProfileScreen', () => {
  it("shows the signed-in user's username and email", async () => {
    await render(<ProfileScreen />);

    expect(screen.getByText('jane')).toBeOnTheScreen();
    expect(screen.getByText('jane@example.com')).toBeOnTheScreen();
  });

  it('shows a loading indicator while the profile loads', async () => {
    mockedUseProfile.mockReturnValue({ user: null, error: null, isLoading: true, retry });
    await render(<ProfileScreen />);

    expect(screen.getByLabelText('Loading profile')).toBeOnTheScreen();
    expect(screen.queryByText('jane')).toBeNull();
  });

  it('shows the error and retries when asked', async () => {
    mockedUseProfile.mockReturnValue({ user: null, error: 'User not found', isLoading: false, retry });
    await render(<ProfileScreen />);

    expect(screen.getByText('User not found')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });

  it('goes back to the feed when the logo and name are pressed', async () => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'Go to feed' }));

    expect(dismissTo).toHaveBeenCalledWith('/');
  });

  it('logs the user out', async () => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'Log out' }));

    expect(logout).toHaveBeenCalled();
  });
});
