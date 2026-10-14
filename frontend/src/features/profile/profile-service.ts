import { apiFetch } from '@/lib/auth/api-client';
import type { WateringLog, WateringStreak } from '@/lib/plant/types';
import { timeZoneQuery } from '@/lib/time-zone';
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

export async function getWateringStreak(): Promise<WateringStreak> {
  return apiFetch<WateringStreak>(`/v1/waterings/streak${timeZoneQuery()}`);
}

/** The user's waterings from `from` (inclusive) to `to` (exclusive), newest first. */
export async function getWaterings(from: Date, to: Date): Promise<WateringLog[]> {
  const range = `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
  return apiFetch<WateringLog[]>(`/v1/waterings?${range}`);
}
