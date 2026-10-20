import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useAuthActions } from '@/features/auth/use-auth-actions';
import { useProfile } from '@/features/profile/use-profile';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { SettingsScreen } from '../settings-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/auth/use-auth-actions');
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/profile/use-profile-actions');
jest.mock('@/stores/onboarding-store', () => ({ useOnboardingStore: jest.fn() }));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuthActions = jest.mocked(useAuthActions);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfileActions = jest.mocked(useProfileActions);
const mockedUseOnboardingStore = jest.mocked(useOnboardingStore);
const onboarding = { step: null, start: jest.fn(), next: jest.fn(), finish: jest.fn() };
const back = jest.fn();
const logout = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null, avatarUrl: null };

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  mockedUseAuthActions.mockReturnValue({ login: jest.fn(), register: jest.fn(), logout });
  mockedUseProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry });
  mockedUseOnboardingStore.mockReturnValue(onboarding);
  mockedUseProfileActions.mockReturnValue({ updateProfile: jest.fn(), changeEmail: jest.fn(), updateAvatar: jest.fn(), removeAvatar: jest.fn() });
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

  it('logs the user out', async () => {
    await render(<SettingsScreen />);

    await user.press(screen.getByRole('button', { name: 'Log out' }));

    expect(logout).toHaveBeenCalled();
  });

  it('starts the tour again', async () => {
    await render(<SettingsScreen />);

    await user.press(screen.getByRole('button', { name: 'Take the tour again' }));

    expect(onboarding.start).toHaveBeenCalled();
  });
});
