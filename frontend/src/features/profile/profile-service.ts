import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type { WateringLog, WateringStreak } from '@/lib/plant/types';
import { createRequestId } from '@/lib/request-id';
import { timeZoneQuery } from '@/lib/time-zone';
import type { ChangeEmailRequest, UpdateProfileRequest, User } from '@/lib/user/types';

export async function getCurrentUser(): Promise<User> {
  return apiFetch<User>('/v1/users/me');
}

export async function updateProfile(request: UpdateProfileRequest): Promise<User> {
  const requestId = createRequestId();
  logAction('profile_update_submitted', { requestId });
  return apiFetch<User>('/v1/users/me', { method: 'PUT', body: request, requestId });
}

export async function changeEmail(request: ChangeEmailRequest): Promise<User> {
  const requestId = createRequestId();
  logAction('email_change_submitted', { requestId });
  return apiFetch<User>('/v1/users/me/email', { method: 'PUT', body: request, requestId });
}

export async function getWateringStreak(): Promise<WateringStreak> {
  return apiFetch<WateringStreak>(`/v1/waterings/streak${timeZoneQuery()}`);
}

/** The user's waterings from `from` (inclusive) to `to` (exclusive), newest first. */
export async function getWaterings(from: Date, to: Date): Promise<WateringLog[]> {
  const range = `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
  return apiFetch<WateringLog[]>(`/v1/waterings?${range}`);
}
