import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { useProfile } from '@/features/profile/use-profile';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';

import { ProfileScreen } from '../profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/profile/use-profile');
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/species/use-discovered-species');
jest.mock('@/features/species/use-species');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseProfile = jest.mocked(useProfile);
const push = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const jane = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: 'Fern collector', avatarUrl: null };

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockedUseProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry });
  jest.mocked(useGarden).mockReturnValue({
    garden: { rooms: [{ id: 'r1', name: 'Balcony', plants: [] }] },
    error: null,
    isLoading: false,
    retry: jest.fn(),
    refresh: jest.fn(),
  });
  jest.mocked(useSpecies).mockReturnValue({ species: [], error: null, retry: jest.fn() });
  jest.mocked(useDiscoveredSpecies).mockReturnValue({ discovered: [], error: null, isLoading: false, retry: jest.fn() });
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

  it('shows your stats, each opening its tab', async () => {
    await render(<ProfileScreen />);

    await user.press(screen.getByRole('button', { name: '0 plants' }));
    expect(push).toHaveBeenCalledWith('/garden');
    await user.press(screen.getByRole('button', { name: '0 of 0 species discovered' }));
    expect(push).toHaveBeenCalledWith('/pluntdex');
  });

  it('shows a dash while the stats load', async () => {
    jest.mocked(useGarden).mockReturnValue({ garden: null, error: null, isLoading: true, retry: jest.fn(), refresh: jest.fn() });
    await render(<ProfileScreen />);

    expect(screen.getByRole('button', { name: 'Plants loading' })).toBeOnTheScreen();
  });

  it('shows the error and retries when asked', async () => {
    mockedUseProfile.mockReturnValue({ user: null, error: 'User not found', isLoading: false, retry });
    await render(<ProfileScreen />);

    expect(screen.getByText('User not found')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
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
});
