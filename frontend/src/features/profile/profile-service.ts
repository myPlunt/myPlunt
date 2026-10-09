import { apiFetch } from '@/lib/auth/api-client';
import type { ChangeEmailRequest, UpdateProfileRequest, User } from '@/lib/user/types';

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/v1/users/me');
}

export async function updateProfile(request: UpdateProfileRequest): Promise<User> {
  return apiFetch<User>('/v1/users/me', { method: 'PUT', body: request });
}

export async function changeEmail(request: ChangeEmailRequest): Promise<User> {
  return apiFetch<User>('/v1/users/me/email', { method: 'PUT', body: request });
}
