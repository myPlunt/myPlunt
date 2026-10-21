import { apiFetch } from '@/lib/auth/api-client';
import type { InboxNotification } from '@/lib/notification/types';

/** The newest notifications the user was sent, newest first. */
export async function getInbox(): Promise<InboxNotification[]> {
  return apiFetch<InboxNotification[]>('/v1/users/me/inbox');
}
