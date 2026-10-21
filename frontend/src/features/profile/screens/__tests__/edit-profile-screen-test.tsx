import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useProfile } from '@/features/profile/use-profile';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { EditProfileScreen } from '../edit-profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn(), Stack: { Screen: () => null } }));
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/profile/use-profile-actions');
jest.mock('@/stores/onboarding-store', () => ({
  ...jest.requireActual('@/stores/onboarding-store'),
  useOnboardingStore: jest.fn(),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfileActions = jest.mocked(useProfileActions);
const mockedUseOnboardingStore = jest.mocked(useOnboardingStore);
const onboarding = { step: null, start: jest.fn(), next: jest.fn(), skipPast: jest.fn(), back: jest.fn(), finish: jest.fn(), previous: null, plantId: null };
const back = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null, avatarUrl: null, onboardingCompleted: true };

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  mockedUseProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry });
  mockedUseOnboardingStore.mockReturnValue(onboarding);
  mockedUseProfileActions.mockReturnValue({ updateProfile: jest.fn(), changeEmail: jest.fn(), updateAvatar: jest.fn(), removeAvatar: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('EditProfileScreen', () => {
  it('shows the profile form filled in with the current user', async () => {
    await render(<EditProfileScreen />);

    expect(screen.getByLabelText('Username')).toHaveDisplayValue('jane');
    expect(screen.getByLabelText('Bio')).toBeOnTheScreen();
  });

  it('shows the error and retries when asked', async () => {
    mockedUseProfile.mockReturnValue({ user: null, error: 'Something went wrong.', isLoading: false, retry });
    await render(<EditProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'Try again' }));

    expect(retry).toHaveBeenCalled();
  });

  it('during the tour, saving the bio moves to the picture step on this same screen', async () => {
    mockedUseOnboardingStore.mockReturnValue({ ...onboarding, step: 'bio' });
    const updateProfile = jest.fn().mockResolvedValue({ ...jane, bio: 'Fern collector' });
    mockedUseProfileActions.mockReturnValue({ updateProfile, changeEmail: jest.fn(), updateAvatar: jest.fn(), removeAvatar: jest.fn() });
    await render(<EditProfileScreen />);

    await user.type(screen.getByLabelText('Bio'), 'Fern collector');
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateProfile).toHaveBeenCalledWith({ username: 'jane', bio: 'Fern collector' });
    expect(onboarding.next).toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
  });

  it('shows the picture card on the avatar step', async () => {
    mockedUseOnboardingStore.mockReturnValue({ ...onboarding, step: 'avatar' });
    await render(<EditProfileScreen />);

    expect(screen.getByText('Add a profile picture?')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Add a profile picture' })).toBeOnTheScreen();
  });
});
