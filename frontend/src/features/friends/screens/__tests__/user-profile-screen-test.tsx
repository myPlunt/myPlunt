import { render, screen, userEvent } from '@testing-library/react-native';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from '@/features/friends/friends-service';
import { useUserProfile } from '@/features/friends/use-user-profile';
import { useGarden } from '@/features/garden/use-garden';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import { ApiError } from '@/lib/auth/api-client';
import type { Garden } from '@/lib/garden/types';
import type { Species } from '@/lib/species/types';
import { AuthStoreProvider } from '@/stores/auth-store';

import { UserProfileScreen } from '../user-profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/friends/use-user-profile');
jest.mock('@/features/friends/friends-service');
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/species/use-discovered-species');
jest.mock('@/features/species/use-species');

const mockedUseUserProfile = jest.mocked(useUserProfile);
const mockedSendFriendRequest = jest.mocked(sendFriendRequest);
const mockedAccept = jest.mocked(acceptFriendRequest);
const mockedDecline = jest.mocked(declineFriendRequest);
const mockedCancel = jest.mocked(cancelFriendRequest);
const mockedRemove = jest.mocked(removeFriend);
const mockedUseGarden = jest.mocked(useGarden);
const mockedUseDiscoveredSpecies = jest.mocked(useDiscoveredSpecies);
const mockedUseSpecies = jest.mocked(useSpecies);
const user = userEvent.setup();
const retry = jest.fn();
const jane = {
  id: 'u2',
  username: 'jane_doe',
  bio: 'Fern collector',
  avatarUrl: null,
  friendship: null,
} as const;

function showProfile(profile: Partial<ReturnType<typeof useUserProfile>>) {
  mockedUseUserProfile.mockReturnValue({ user: jane, error: null, isLoading: false, retry, ...profile });
  return render(<UserProfileScreen userId="u2" />, { wrapper: AuthStoreProvider });
}

const garden: Garden = {
  rooms: [
    {
      id: 'r1',
      name: 'Living room',
      plants: [
        {
          id: 'p1',
          name: 'Monty',
          speciesId: 'monstera',
          speciesName: 'Monstera',
          wateringFrequencyDays: 7,
          lastWateredAt: '2026-10-18T09:00:00Z',
          nextWateringAt: '2026-10-25T09:00:00Z',
          wateringStreak: 9,
          photoUrl: null,
        },
      ],
    },
  ],
};

function species(id: string, commonName: string): Species {
  return {
    id,
    commonName,
    scientificName: `${commonName} sp.`,
    wateringFrequencyDays: 7,
    region: null,
    sunlightNeeds: null,
    common: true,
    imageUrl: null,
  };
}

beforeEach(() => {
  mockedUseGarden.mockReturnValue({ garden, error: null, isLoading: false, retry: jest.fn(), refresh: jest.fn() });
  mockedUseSpecies.mockReturnValue({
    species: [species('monstera', 'Monstera'), species('basil', 'Basil')],
    error: null,
    retry: jest.fn(),
  });
  mockedUseDiscoveredSpecies.mockReturnValue({
    discovered: [{ speciesId: 'monstera', discoveredAt: '2026-10-01T10:00:00Z' }],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

it("shows a friend's stats and garden, with plants you can't open", async () => {
  await showProfile({ user: { ...jane, friendship: 'friends' } });

  expect(mockedUseGarden).toHaveBeenCalledWith('u2');
  expect(mockedUseDiscoveredSpecies).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: '1 plant' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: '1 of 2 species discovered' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Top watering streak 9' })).toBeOnTheScreen();
  expect(screen.getByText('Monty')).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Monty' })).toBeNull();
});

it("switches to a friend's PluntDex from the tab or the discovered count", async () => {
  await showProfile({ user: { ...jane, friendship: 'friends' } });

  await user.press(screen.getByRole('tab', { name: 'PluntDex' }));
  expect(screen.getByRole('button', { name: 'Monstera, discovered' })).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Basil, not discovered yet' })).toBeOnTheScreen();
  expect(screen.queryByText('Monty')).toBeNull();

  await user.press(screen.getByRole('tab', { name: 'Garden' }));
  await user.press(screen.getByRole('button', { name: '1 of 2 species discovered' }));
  expect(screen.getByRole('button', { name: 'Monstera, discovered' })).toBeOnTheScreen();
});

it("shows why a friend's garden didn't load and retries it", async () => {
  const retryGarden = jest.fn();
  mockedUseGarden.mockReturnValue({ garden: null, error: 'Something went wrong', isLoading: false, retry: retryGarden, refresh: jest.fn() });
  await showProfile({ user: { ...jane, friendship: 'friends' } });

  await user.press(screen.getByRole('button', { name: 'Try again' }));

  expect(retryGarden).toHaveBeenCalled();
});

it("keeps a stranger's garden private and doesn't ask for it", async () => {
  await showProfile({});

  expect(screen.getByText('Only friends can see this garden')).toBeOnTheScreen();
  expect(screen.queryByRole('tab', { name: 'Garden' })).toBeNull();
  expect(mockedUseGarden).not.toHaveBeenCalled();
});

it('sends a friend request and then offers to cancel it', async () => {
  mockedSendFriendRequest.mockResolvedValue();
  await showProfile({});

  await user.press(screen.getByRole('button', { name: 'Add friend' }));

  expect(mockedSendFriendRequest).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Cancel request' })).toBeOnTheScreen();
  expect(screen.queryByRole('button', { name: 'Add friend' })).toBeNull();
});

it('cancels a request you sent, leaving them to add again', async () => {
  mockedCancel.mockResolvedValue();
  await showProfile({ user: { ...jane, friendship: 'request_sent' } });

  await user.press(screen.getByRole('button', { name: 'Cancel request' }));

  expect(mockedCancel).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
});

it('shows why cancelling failed and keeps Cancel request', async () => {
  mockedCancel.mockRejectedValue(new ApiError(404, 'not found', { detail: 'No pending friend request with this user' }));
  await showProfile({ user: { ...jane, friendship: 'request_sent' } });

  await user.press(screen.getByRole('button', { name: 'Cancel request' }));

  expect(screen.getByText('No pending friend request with this user')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Cancel request' })).toBeOnTheScreen();
});

it('shows why a friend request failed and keeps Add friend', async () => {
  const error = new ApiError(409, 'conflict', { detail: 'Request already sent' });
  mockedSendFriendRequest.mockRejectedValue(error);
  await showProfile({});

  await user.press(screen.getByRole('button', { name: 'Add friend' }));

  expect(screen.getByText('Request already sent')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
});

it('removes a friend after asking, leaving them to add again', async () => {
  mockedRemove.mockResolvedValue();
  await showProfile({ user: { ...jane, friendship: 'friends' } });

  await user.press(screen.getByRole('button', { name: 'Friends' }));
  expect(screen.getByText('Remove jane_doe as a friend?')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Remove' }));

  expect(mockedRemove).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
  expect(screen.queryByText('Monty')).toBeNull();
  expect(screen.getByText('Only friends can see this garden')).toBeOnTheScreen();
});

it('keeps the friend when the popup is cancelled', async () => {
  await showProfile({ user: { ...jane, friendship: 'friends' } });

  await user.press(screen.getByRole('button', { name: 'Friends' }));
  await user.press(screen.getByRole('button', { name: 'Cancel' }));

  expect(mockedRemove).not.toHaveBeenCalled();
  expect(screen.queryByText('Remove jane_doe as a friend?')).toBeNull();
  expect(screen.getByRole('button', { name: 'Friends' })).toBeOnTheScreen();
});

it('shows why removing failed inside the popup', async () => {
  mockedRemove.mockRejectedValue(new ApiError(404, 'not found', { detail: "You're not friends with this user" }));
  await showProfile({ user: { ...jane, friendship: 'friends' } });

  await user.press(screen.getByRole('button', { name: 'Friends' }));
  await user.press(screen.getByRole('button', { name: 'Remove' }));

  expect(screen.getByText("You're not friends with this user")).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Remove' })).toBeOnTheScreen();
});

it('lets you accept a request they sent', async () => {
  mockedAccept.mockResolvedValue();
  await showProfile({ user: { ...jane, friendship: 'request_received' } });

  expect(screen.getByText('jane_doe sent you a friend request')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Accept' }));

  expect(mockedAccept).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Friends' })).toBeOnTheScreen();
  expect(screen.getByText('Monty')).toBeOnTheScreen();
});

it('lets you decline a request they sent, leaving them to add again', async () => {
  mockedDecline.mockResolvedValue();
  await showProfile({ user: { ...jane, friendship: 'request_received' } });

  await user.press(screen.getByRole('button', { name: 'Decline' }));

  expect(mockedDecline).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
  expect(screen.queryByText('jane_doe sent you a friend request')).toBeNull();
});
