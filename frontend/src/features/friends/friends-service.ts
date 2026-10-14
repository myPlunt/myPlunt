import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import { createRequestId } from '@/lib/request-id';
import type { FriendRequests, UserSummary } from '@/lib/user/types';

/** Other users whose username contains the query, A to Z, at most 20. */
export async function searchUsers(query: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/v1/users/search?q=${encodeURIComponent(query)}`);
}

/** Another user's profile, with how they relate to the signed-in user. */
export async function getUser(userId: string): Promise<UserSummary> {
  return apiFetch<UserSummary>(`/v1/users/${userId}`);
}

/** Asks another user to be friends; it stays pending until they answer. */
export async function sendFriendRequest(userId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('friend_request_submitted', { requestId, context: { other_user_id: userId } });
  return apiFetch<void>('/v1/friends/requests', { method: 'POST', body: { userId }, requestId });
}

/** The signed-in user's friends, A to Z. */
export async function getFriends(): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>('/v1/friends');
}

/** Requests waiting for an answer: received from others and sent by the signed-in user. */
export async function getFriendRequests(): Promise<FriendRequests> {
  return apiFetch<FriendRequests>('/v1/friends/requests');
}

/** Accepts the request userId sent the signed-in user. */
export async function acceptFriendRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/friends/requests/${userId}/accept`, { method: 'POST' });
}

/** Declines the request userId sent; they can ask again later. */
export async function declineFriendRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/friends/requests/${userId}/decline`, { method: 'POST' });
}

/** Takes back the request the signed-in user sent userId, before they answer. */
export async function cancelFriendRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/friends/requests/${userId}/cancel`, { method: 'POST' });
}
