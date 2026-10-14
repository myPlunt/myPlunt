import { render, screen, userEvent } from '@testing-library/react-native';

import { acceptFriendRequest, declineFriendRequest, sendFriendRequest } from '@/features/friends/friends-service';
import { useUserProfile } from '@/features/friends/use-user-profile';
import { ApiError } from '@/lib/auth/api-client';
import { AuthStoreProvider } from '@/stores/auth-store';

import { UserProfileScreen } from '../user-profile-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/friends/use-user-profile');
jest.mock('@/features/friends/friends-service');

const mockedUseUserProfile = jest.mocked(useUserProfile);
const mockedSendFriendRequest = jest.mocked(sendFriendRequest);
const mockedAccept = jest.mocked(acceptFriendRequest);
const mockedDecline = jest.mocked(declineFriendRequest);
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

afterEach(() => {
  jest.resetAllMocks();
});

it('shows who they are', async () => {
  await showProfile({});

  expect(mockedUseUserProfile).toHaveBeenCalledWith('u2');
  expect(screen.getByText('jane_doe')).toBeOnTheScreen();
  expect(screen.getByText('Fern collector')).toBeOnTheScreen();
});

it('sends a friend request and then shows it as requested', async () => {
  mockedSendFriendRequest.mockResolvedValue();
  await showProfile({});

  await user.press(screen.getByRole('button', { name: 'Add friend' }));

  expect(mockedSendFriendRequest).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Requested' })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Add friend' })).toBeNull();
});

it('shows why a friend request failed and keeps Add friend', async () => {
  mockedSendFriendRequest.mockRejectedValue(new ApiError(409, 'conflict', { detail: 'Request already sent' }));
  await showProfile({});

  await user.press(screen.getByRole('button', { name: 'Add friend' }));

  expect(screen.getByText('Request already sent')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
});

it.each([
  ['friends', 'Friends'],
  ['request_sent', 'Requested'],
] as const)('shows %s as a disabled "%s" instead of Add friend', async (friendship, label) => {
  await showProfile({ user: { ...jane, friendship } });

  expect(screen.getByRole('button', { name: label })).toBeDisabled();
  expect(screen.queryByRole('button', { name: 'Add friend' })).toBeNull();
});

it('lets you accept a request they sent', async () => {
  mockedAccept.mockResolvedValue();
  await showProfile({ user: { ...jane, friendship: 'request_received' } });

  expect(screen.getByText('jane_doe sent you a friend request')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Accept' }));

  expect(mockedAccept).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Friends' })).toBeDisabled();
});

it('lets you decline a request they sent, leaving them to add again', async () => {
  mockedDecline.mockResolvedValue();
  await showProfile({ user: { ...jane, friendship: 'request_received' } });

  await user.press(screen.getByRole('button', { name: 'Decline' }));

  expect(mockedDecline).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
  expect(screen.queryByText('jane_doe sent you a friend request')).toBeNull();
});

it('shows a spinner while loading', async () => {
  await showProfile({ user: null, isLoading: true });

  expect(screen.getByLabelText('Loading profile')).toBeOnTheScreen();
});

it('shows the error with a way to try again', async () => {
  await showProfile({ user: null, error: 'Offline' });

  expect(screen.getByText('Offline')).toBeOnTheScreen();
  await user.press(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalled();
});
