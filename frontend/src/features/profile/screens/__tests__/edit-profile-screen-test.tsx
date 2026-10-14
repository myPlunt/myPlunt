import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useProfile } from '@/features/profile/use-profile';
import { useProfileActions } from '@/features/profile/use-profile-actions';

import { EditProfileScreen } from '../edit-profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/profile/use-profile-actions');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseProfileActions = jest.mocked(useProfileActions);
const back = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null };

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  mockedUseProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry });
  mockedUseProfileActions.mockReturnValue({ updateProfile: jest.fn(), changeEmail: jest.fn() });
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
});
