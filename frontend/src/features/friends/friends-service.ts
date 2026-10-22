import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import { createRequestId } from '@/lib/request-id';
import type { FriendRequests, UserSummary } from '@/lib/user/types';

export async function searchUsers(query: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/v1/users/search?q=${encodeURIComponent(query)}`);
}

export async function getUser(userId: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`/v1/users/${userId}`);
}

export async function sendFriendRequest(userId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('friend_request_submitted', { requestId, context: { other_user_id: userId } });
  return apiFetch<void>('/v1/friends/requests', { method: 'POST', body: { userId }, requestId });
}

export async function getFriends(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>('/v1/friends');
}

export async function getFriendRequests(): Promise<FriendRequests> {
  return apiFetch<FriendRequests>('/v1/friends/requests');
}

export async function acceptFriendRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/friends/requests/${userId}/accept`, { method: 'POST' });
}

export async function declineFriendRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/friends/requests/${userId}/decline`, { method: 'POST' });
}

export async function cancelFriendRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/friends/requests/${userId}/cancel`, { method: 'POST' });
}

export async function removeFriend(userId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('friend_remove_submitted', { requestId, context: { other_user_id: userId } });
  return apiFetch<void>(`/v1/friends/${userId}/remove`, { method: 'POST', requestId });
}
