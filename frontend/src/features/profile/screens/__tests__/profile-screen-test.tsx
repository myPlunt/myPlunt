import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useProfile } from '@/features/profile/use-profile';
import { useWateringStreak } from '@/features/profile/use-watering-streak';

import { ProfileScreen } from '../profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/profile/use-watering-streak');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseProfile = jest.mocked(useProfile);
const mockedUseWateringStreak = jest.mocked(useWateringStreak);
const push = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: 'Fern collector' };

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockedUseProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry });
  mockedUseWateringStreak.mockReturnValue(7);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ProfileScreen', () => {
  it("shows the signed-in user's username, email and bio", async () => {
    await render(<ProfileScreen />);

    expect(screen.getByText('jane')).toBeOnTheScreen();
    expect(screen.getByText('jane@example.com')).toBeOnTheScreen();
    expect(screen.getByText('Fern collector')).toBeOnTheScreen();
  });

  it('leaves the bio out when the user has none', async () => {
    mockedUseProfile.mockReturnValue({ user: { ...jane, bio: null }, error: null, isLoading: false, retry });
    await render(<ProfileScreen />);

    expect(screen.queryByText('Fern collector')).toBeNull();
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

  it('opens Edit profile from the button under the profile', async () => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'Edit profile' }));

    expect(push).toHaveBeenCalledWith('/edit-profile');
  });

  it('opens the garden from the button under the profile', async () => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'My garden' }));

    expect(push).toHaveBeenCalledWith('/garden');
  });

  it('keeps friends, the watering calendar and settings in the burger menu', async () => {
    await render(<ProfileScreen />);
    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Open menu' }));

    expect(screen.getByRole('button', { name: 'Close menu' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open friends' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open watering calendar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeOnTheScreen();
  });

  it('lists settings, friends and the watering calendar in that order', async () => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'Open menu' }));

    expect(
      screen.getAllByRole('button', { name: /^Open (settings|friends|watering calendar)$/ }).map(
        (button) => button.props.accessibilityLabel,
      ),
    ).toEqual(['Open settings', 'Open friends', 'Open watering calendar']);
  });

  it.each([
    ['Open settings', '/settings'],
    ['Open friends', '/friends'],
    ['Open watering calendar', '/watering-calendar'],
  ])('"%s" in the menu opens %s and closes the menu', async (label, path) => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'Open menu' }));
    await user.press(screen.getByRole('button', { name: label }));

    expect(push).toHaveBeenCalledWith(path);
    expect(screen.queryByRole('button', { name: label })).toBeNull();
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeOnTheScreen();
  });

  it('closes the menu from the cross or a press anywhere else', async () => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: 'Open menu' }));
    await user.press(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Open menu' }));
    await user.press(screen.getByLabelText('Dismiss menu'));
    expect(screen.queryByRole('button', { name: 'Open settings' })).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows the user's watering streak", async () => {
    await render(<ProfileScreen />);

    expect(screen.getByLabelText('Watering streak: 7')).toBeOnTheScreen();
  });

  it('leaves the streak out until it has loaded', async () => {
    mockedUseWateringStreak.mockReturnValue(null);
    await render(<ProfileScreen />);

    expect(screen.queryByLabelText(/Watering streak/)).toBeNull();
  });

  it('has no back button, because Profile is a tab', async () => {
    await render(<ProfileScreen />);

    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
  });
});
