import { render, screen, userEvent } from '@testing-library/react-native';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  sendFriendRequest,
} from '@/features/friends/friends-service';
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
const mockedCancel = jest.mocked(cancelFriendRequest);
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
  mockedSendFriendRequest.mockRejectedValue(new ApiError(409, 'conflict', { detail: 'Request already sent' }));
  await showProfile({});

  await user.press(screen.getByRole('button', { name: 'Add friend' }));

  expect(screen.getByText('Request already sent')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
});

it('shows friends as a disabled "Friends" instead of Add friend', async () => {
  await showProfile({ user: { ...jane, friendship: 'friends' } });

  expect(screen.getByRole('button', { name: 'Friends' })).toBeDisabled();
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
