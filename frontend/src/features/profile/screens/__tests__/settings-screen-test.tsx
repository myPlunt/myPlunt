import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useAuthActions } from '@/features/auth/use-auth-actions';
import { useProfile } from '@/features/profile/use-profile';
import { useProfileActions } from '@/features/profile/use-profile-actions';

import { SettingsScreen } from '../settings-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/auth/use-auth-actions');
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/profile/use-profile-actions');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuthActions = jest.mocked(useAuthActions);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfileActions = jest.mocked(useProfileActions);
const back = jest.fn();
const logout = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null };

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  mockedUseAuthActions.mockReturnValue({ login: jest.fn(), register: jest.fn(), logout });
  mockedUseProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry });
  mockedUseProfileActions.mockReturnValue({ updateProfile: jest.fn(), changeEmail: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('SettingsScreen', () => {
  it('shows "Settings" as the page title', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByRole('header', { name: 'Settings' })).toBeOnTheScreen();
  });

  it('lets the user change their email, but not edit profile details', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByLabelText('Email')).toHaveDisplayValue('jane@example.com');
    expect(screen.queryByLabelText('Username')).toBeNull();
    expect(screen.queryByLabelText('Bio')).toBeNull();
  });

  it('lists changing the password as coming soon', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByText('Change password')).toBeOnTheScreen();
    expect(screen.getByText('Coming soon')).toBeOnTheScreen();
  });

  it('shows a loading indicator while the account loads', async () => {
    mockedUseProfile.mockReturnValue({ user: null, error: null, isLoading: true, retry });
    await render(<SettingsScreen />);

    expect(screen.getByLabelText('Loading account')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Email')).toBeNull();
  });

  it('shows the error and retries when asked', async () => {
    mockedUseProfile.mockReturnValue({ user: null, error: 'Something went wrong.', isLoading: false, retry });
    await render(<SettingsScreen />);

    await user.press(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalled();
  });

  it('logs the user out', async () => {
    await render(<SettingsScreen />);

    await user.press(screen.getByRole('button', { name: 'Log out' }));

    expect(logout).toHaveBeenCalled();
  });

  it('goes back one screen when the logo is pressed', async () => {
    await render(<SettingsScreen />);

    await user.press(screen.getByRole('button', { name: 'Go back' }));

    expect(back).toHaveBeenCalled();
  });
});
