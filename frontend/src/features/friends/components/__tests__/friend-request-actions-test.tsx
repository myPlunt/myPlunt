import { render, screen, userEvent } from '@testing-library/react-native';

import { acceptFriendRequest, declineFriendRequest } from '@/features/friends/friends-service';
import { ApiError } from '@/lib/auth/api-client';
import { AuthStoreProvider } from '@/stores/auth-store';

import { FriendRequestActions } from '../friend-request-actions';

jest.mock('@/features/friends/friends-service');

const mockedAccept = jest.mocked(acceptFriendRequest);
const mockedDecline = jest.mocked(declineFriendRequest);
const user = userEvent.setup();
const onAnswered = jest.fn();

afterEach(() => {
  jest.resetAllMocks();
});

async function renderActions() {
  await render(<FriendRequestActions userId="u4" onAnswered={onAnswered} />, { wrapper: AuthStoreProvider });
}

it('accepts the request and keeps both buttons disabled', async () => {
  mockedAccept.mockResolvedValue();
  await renderActions();

  await user.press(screen.getByRole('button', { name: 'Accept' }));

  expect(mockedAccept).toHaveBeenCalledWith('u4');
  expect(onAnswered).toHaveBeenCalledWith('accepted');
  expect(screen.getByRole('button', { name: 'Decline' })).toBeDisabled();
});

it('declines the request', async () => {
  mockedDecline.mockResolvedValue();
  await renderActions();

  await user.press(screen.getByRole('button', { name: 'Decline' }));

  expect(mockedDecline).toHaveBeenCalledWith('u4');
  expect(onAnswered).toHaveBeenCalledWith('declined');
});

it('shows why answering failed and lets you try again', async () => {
  mockedAccept.mockRejectedValue(new ApiError(404, 'not found', { detail: 'No friend request from this user' }));
  await renderActions();

  await user.press(screen.getByRole('button', { name: 'Accept' }));

  expect(screen.getByText('No friend request from this user')).toBeOnTheScreen();
  expect(onAnswered).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Accept' })).toBeEnabled();
});
