import { removePushToken } from '@/features/notifications/push-token-service';
import { publicFetch } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/lib/auth/types';
import { flushLogs, logAction } from '@/lib/logger';
import { clearCache } from '@/lib/offline/cache';
import { createRequestId } from '@/lib/request-id';

export async function login(credentials: LoginRequest): Promise<void> {
  const requestId = createRequestId();
  logAction('login_submitted', { requestId });
  const tokens = await publicFetch<AuthResponse>('/v1/auth/login', credentials, { requestId });
  // The data saved for offline belongs to whoever was signed in before. Cleared here, not
  // only on logout: an expired session ends without one.
  await clearCache();
  await tokenStorage.setTokens(tokens);
}

export async function register(details: RegisterRequest): Promise<void> {
  const requestId = createRequestId();
  logAction('registration_submitted', { requestId });
  const tokens = await publicFetch<AuthResponse>('/v1/auth/register', details, { requestId });
  await clearCache();
  await tokenStorage.setTokens(tokens);
}

export async function logout(): Promise<void> {
  logAction('logout_submitted');
  // Sent while the session still exists; queued lines would otherwise go out with the next
  // user who signs in on this device, under their id.
  await flushLogs();
  // Same reason: once signed out, this phone shouldn't keep getting the account's reminders.
  await removePushToken().catch(() => {});
  const tokens = await tokenStorage.getTokens();
  await tokenStorage.clearTokens();
  // The data saved for offline goes too; if that fails, the next sign-in clears it.
  await clearCache().catch(() => {});
  if (tokens) {
    publicFetch('/v1/auth/logout', { refreshToken: tokens.refreshToken }).catch(() => {});
  }
}
