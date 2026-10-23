import { sendWaterings } from '@/features/garden/watering-outbox';
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
  // ponytail: waterings that still can't be sent are cleared with the cache below; tag them with
  // the user's id if people sign out with unsynced waterings.
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
