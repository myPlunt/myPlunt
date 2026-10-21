import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useAuthActions } from '@/features/auth/use-auth-actions';
import { useProfile } from '@/features/profile/use-profile';
import { useNotificationSettings } from '@/features/profile/use-notification-settings';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { SettingsScreen } from '../settings-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/auth/use-auth-actions');
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/profile/use-profile-actions');
jest.mock('@/features/profile/use-notification-settings');
jest.mock('@/stores/onboarding-store', () => ({ useOnboardingStore: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuthActions = jest.mocked(useAuthActions);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfileActions = jest.mocked(useProfileActions);
const mockedUseNotificationSettings = jest.mocked(useNotificationSettings);
const mockedUseOnboardingStore = jest.mocked(useOnboardingStore);
const onboarding = { step: null, start: jest.fn(), next: jest.fn(), skipPast: jest.fn(), back: jest.fn(), finish: jest.fn(), previous: null, plantId: null };
const toggle = jest.fn();
const notifications = { waterReminders: true, weatherAlerts: true, friendActivity: true, friendNudges: true, plantSitting: false };
const back = jest.fn();
const dismissTo = jest.fn();
const logout = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null, avatarUrl: null, onboardingCompleted: true };

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, dismissTo, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  mockedUseAuthActions.mockReturnValue({ login: jest.fn(), register: jest.fn(), logout });
  mockedUseProfile.mockReturnValue({ refresh: jest.fn(), user: jane, error: null, isLoading: false, retry });
  mockedUseOnboardingStore.mockReturnValue(onboarding);
  mockedUseProfileActions.mockReturnValue({ updateProfile: jest.fn(), changeEmail: jest.fn(), updateAvatar: jest.fn(), removeAvatar: jest.fn(), updateNotificationSettings: jest.fn() });
  mockedUseNotificationSettings.mockReturnValue({ settings: notifications, allowed: true, turnOn: jest.fn(), error: null, isLoading: false, retry: jest.fn(), toggle });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('SettingsScreen', () => {
  it('lets the user change their email, but not edit profile details', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByLabelText('Email')).toHaveDisplayValue('jane@example.com');
    expect(screen.queryByLabelText('Username')).toBeNull();
    expect(screen.queryByLabelText('Bio')).toBeNull();
  });

  it('turns a kind of notification off from its switch', async () => {
    await render(<SettingsScreen />);

    expect(screen.getByRole('switch', { name: 'Plant sitting' })).not.toBeChecked();
    await user.press(screen.getByRole('switch', { name: 'Water reminders' }));

    expect(toggle).toHaveBeenCalledWith('waterReminders', false);
  });

  it('logs the user out', async () => {
    await render(<SettingsScreen />);

    await user.press(screen.getByRole('button', { name: 'Log out' }));

    expect(logout).toHaveBeenCalled();
  });

  it('starts the tour again and goes back to the tabs, which open its welcome page', async () => {
    await render(<SettingsScreen />);

    await user.press(screen.getByRole('button', { name: 'Take the tour again' }));

    expect(onboarding.start).toHaveBeenCalled();
    expect(dismissTo).toHaveBeenCalledWith('/');
  });
});
