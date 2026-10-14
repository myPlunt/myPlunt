import { apiFetch } from '@/lib/auth/api-client';
import type { UserSummary } from '@/lib/user/types';

/** Other users whose username contains the query, A to Z, at most 20. */
export async function searchUsers(query: string): Promise<UserSummary[]> {
  return apiFetch<UserSummary[]>(`/v1/users/search?q=${encodeURIComponent(query)}`);
}

/** Asks another user to be friends; it stays pending until they answer. */
export async function sendFriendRequest(userId: string): Promise<void> {
  return apiFetch<void>('/v1/friends/requests', { method: 'POST', body: { userId } });
}
