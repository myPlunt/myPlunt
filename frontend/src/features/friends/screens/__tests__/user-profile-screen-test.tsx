import { render, screen, userEvent } from '@testing-library/react-native';

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  removeFriend,
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
const mockedRemove = jest.mocked(removeFriend);
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
});

it('lets you decline a request they sent, leaving them to add again', async () => {
  mockedDecline.mockResolvedValue();
  await showProfile({ user: { ...jane, friendship: 'request_received' } });

  await user.press(screen.getByRole('button', { name: 'Decline' }));

  expect(mockedDecline).toHaveBeenCalledWith('u2');
  expect(screen.getByRole('button', { name: 'Add friend' })).toBeOnTheScreen();
  expect(screen.queryByText('jane_doe sent you a friend request')).toBeNull();
});
