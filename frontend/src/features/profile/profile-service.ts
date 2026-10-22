import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type { WateringLog, WateringStreak } from '@/lib/plant/types';
import { createRequestId } from '@/lib/request-id';
import { timeZoneQuery } from '@/lib/time-zone';
import type {
  ChangeEmailRequest,
  NotificationSettings,
  UpdateAvatarRequest,
  UpdateProfileRequest,
  User,
} from '@/lib/user/types';

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

export async function updateAvatar(request: UpdateAvatarRequest): Promise<User> {
  const requestId = createRequestId();
  logAction('avatar_update_submitted', { requestId });
  return apiFetch<User>('/v1/users/me/avatar', { method: 'PUT', body: request, requestId });
}

export async function removeAvatar(): Promise<void> {
  const requestId = createRequestId();
  logAction('avatar_remove_submitted', { requestId });
  return apiFetch<void>('/v1/users/me/avatar', { method: 'DELETE', requestId });
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return apiFetch<NotificationSettings>('/v1/users/me/notifications');
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
  const requestId = createRequestId();
  logAction('notification_settings_update_submitted', { requestId });
  return apiFetch<NotificationSettings>('/v1/users/me/notifications', { method: 'PUT', body: settings, requestId });
}

export async function getWateringStreak(): Promise<WateringStreak> {
  return apiFetch<WateringStreak>(`/v1/waterings/streak${timeZoneQuery()}`);
}

/** The user's waterings from `from` (inclusive) to `to` (exclusive), newest first. */
export async function getWaterings(from: Date, to: Date): Promise<WateringLog[]> {
  const range = `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
  return apiFetch<WateringLog[]>(`/v1/waterings?${range}`);
}
