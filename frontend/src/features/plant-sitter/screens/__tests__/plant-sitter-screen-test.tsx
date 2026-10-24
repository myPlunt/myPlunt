import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { acceptCareRequest, sendCareRequest } from '@/features/plant-sitter/plant-sitter-service';
import { useSitters } from '@/features/plant-sitter/use-sitters';
import { ApiError } from '@/lib/auth/api-client';
import { AuthStoreProvider } from '@/stores/auth-store';

import { PlantSitterScreen } from '../plant-sitter-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/plant-sitter/use-sitters');
jest.mock('@/features/plant-sitter/plant-sitter-service');

const reload = jest.fn();
const user = userEvent.setup();
const sara = { id: 'u2', username: 'sara', bio: null, avatarUrl: null, friendship: 'friends' } as const;
const tom = { ...sara, id: 'u3', username: 'tom' };

function sittersState(state: Partial<ReturnType<typeof useSitters>>) {
  jest.mocked(useSitters).mockReturnValue({
    sitters: [{ user: sara, city: 'Enschede', distanceKm: 1.2, sameCity: true }],
    careRequests: { received: [], sent: [] },
    error: null,
    retry: jest.fn(),
    reload,
    ...state,
  });
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 6, 12), advanceTimers: true });
  sittersState({});
  jest.mocked(useRouter).mockReturnValue({ push: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useGarden).mockReturnValue({ garden: null } as ReturnType<typeof useGarden>);
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe('PlantSitterScreen', () => {
  it('asks a friend for the trip dates, ending at the start of the day after the last day away', async () => {
    jest.mocked(sendCareRequest).mockResolvedValue();
    await render(<PlantSitterScreen />, { wrapper: AuthStoreProvider });

    await user.press(screen.getByRole('button', { name: 'Ask sara to plant-sit' }));

    // Default trip: tomorrow (7 Nov) for a week, until 13 Nov.
    expect(sendCareRequest).toHaveBeenCalledWith('u2', new Date(2026, 10, 7), new Date(2026, 10, 14));
    expect(reload).toHaveBeenCalled();
  });

  it('shows why a request failed next to the friend', async () => {
    jest.mocked(sendCareRequest).mockRejectedValue(new ApiError(409, 'Conflict', { detail: 'You already asked this friend' }));
    await render(<PlantSitterScreen />, { wrapper: AuthStoreProvider });

    await user.press(screen.getByRole('button', { name: 'Ask sara to plant-sit' }));

    expect(await screen.findByText('You already asked this friend')).toBeOnTheScreen();
    expect(reload).not.toHaveBeenCalled();
  });

  it('lets you accept a request someone sent you', async () => {
    jest.mocked(acceptCareRequest).mockResolvedValue();
    sittersState({
      careRequests: {
        received: [{ user: tom, from: '2026-11-07T00:00:00Z', until: '2026-11-16T00:00:00Z', plantCount: 11, status: 'pending' }],
        sent: [],
      },
    });
    await render(<PlantSitterScreen />, { wrapper: AuthStoreProvider });

    expect(screen.getByText(/Wants you to look after 11 plants/)).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Accept' }));

    expect(acceptCareRequest).toHaveBeenCalledWith('u3');
    expect(reload).toHaveBeenCalled();
  });
});
