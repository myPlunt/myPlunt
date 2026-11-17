import { sendWaterings } from '@/features/garden/watering-outbox';
import { removePushToken } from '@/features/notifications/push-token-service';
import { apiFetch, publicFetch } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/lib/auth/types';
import { flushLogs, logAction } from '@/lib/logger';
import { clearCache } from '@/lib/offline/cache';
import { createRequestId } from '@/lib/request-id';
import type { DeleteAccountRequest } from '@/lib/user/types';

export async function login(credentials: LoginRequest): Promise<void> {
  const requestId = createRequestId();
  logAction('login_submitted', { requestId });
  const tokens = await publicFetch<AuthResponse>('/v1/auth/login', credentials, { requestId });
  // Cleared at sign-in too, not only on logout: an expired session ends without one.
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
  // Sent while the session exists; otherwise the lines would go out under the next user's id.
  await sendWaterings();
  await flushLogs();
  await removePushToken().catch(() => {});
  const tokens = await tokenStorage.getTokens();
  await tokenStorage.clearTokens();
  // If this fails, the next sign-in clears it.
  await clearCache().catch(() => {});
  if (tokens) {
    publicFetch('/v1/auth/logout', { refreshToken: tokens.refreshToken }).catch(() => {});
  }
}

/** Deletes the account on the server, then everything this phone kept of it. Throws, keeping the session, if it fails. */
export async function deleteAccount(request: DeleteAccountRequest): Promise<void> {
  const requestId = createRequestId();
  logAction('account_delete_submitted', { requestId });
  // Sent while the account exists: afterwards they'd be rejected. Queued waterings are dropped with the cache.
  await flushLogs();
  await apiFetch<void>('/v1/users/me', { method: 'DELETE', body: request, requestId });
  await tokenStorage.clearTokens();
  // If this fails, the next sign-in clears it.
  await clearCache().catch(() => {});
}
