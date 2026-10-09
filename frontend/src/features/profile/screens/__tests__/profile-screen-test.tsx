import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useAuthActions } from '@/features/auth/use-auth-actions';

import { ProfileScreen } from '../profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/auth/use-auth-actions');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuthActions = jest.mocked(useAuthActions);
const dismissTo = jest.fn();
const logout = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ dismissTo } as unknown as ReturnType<typeof useRouter>);
  mockedUseAuthActions.mockReturnValue({ login: jest.fn(), register: jest.fn(), logout });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ProfileScreen', () => {
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
