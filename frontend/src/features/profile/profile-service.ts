import { apiFetch } from '@/lib/auth/api-client';
import type { User } from '@/lib/user/types';

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/v1/users/me');
}
