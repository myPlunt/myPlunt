import { logError, logWarning } from '@/lib/logger';
import { createRequestId } from '@/lib/request-id';

import { tokenStorage, type TokenPair } from './token-storage';
import type { AuthResponse } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  /** The backend's ProblemDetail "detail" — a message already written to be user-safe. */
  detail?: string;
  fieldErrors?: Record<string, string>;
  requestId?: string;

  constructor(
    status: number,
    message: string,
    options?: { detail?: string; fieldErrors?: Record<string, string>; requestId?: string },
  ) {
    super(message);
    this.status = status;
    this.detail = options?.detail;
    this.fieldErrors = options?.fieldErrors;
    this.requestId = options?.requestId;
  }
}

// statusMessages is only a fallback for statuses where the backend sends no useful detail (e.g. 500).
export function describeError(error: unknown, statusMessages: Record<number, string> = {}): string {
  if (error instanceof ApiError) {
    if (error.detail) return error.detail;
    if (statusMessages[error.status]) return statusMessages[error.status];
  }
  return 'Something went wrong. Please try again.';
}

interface ProblemDetailBody {
  detail?: string;
  errors?: Record<string, string>;
}

// status 0 marks "no response at all": the backend is down, or the device is offline.
const NETWORK_ERROR_DETAIL = "Can't reach myPlunt right now. Check your connection and try again.";

const SLOW_RESPONSE_MS = 3000;

// A GET with no answer by then counts as offline (status 0): React Native's fetch has no time limit
// on Android. Other writes wait as long as it takes, since retrying a slow one could save it twice.
const TIMEOUT_MS = 10_000;

// Going offline takes this many failed tries to reach the server, this far apart. Tune them here.
const CHECKS_BEFORE_OFFLINE = 3;
const CHECK_EVERY_MS = 2000;
// Once offline, a waiting request keeps its spinner this much longer, while the app moves to the
// garden, so the screen being left doesn't flash its error first.
const LEAVE_SCREEN_MS = 1000;

/** Any answer at all, even an error status, means the connection works. */
export async function canReachServer(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    await fetch(`${API_BASE_URL}/actuator/health`, { signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

let reachable = true;
let checking: Promise<boolean> | null = null;
const reachabilityListeners = new Set<(reachable: boolean) => void>();

function setReachable(value: boolean) {
  if (value === reachable) return;
  reachable = value;
  reachabilityListeners.forEach((listener) => listener(value));
}

/** Calls back each time the server stops or starts answering; returns the unsubscribe. */
export function onReachabilityChange(listener: (reachable: boolean) => void): () => void {
  reachabilityListeners.add(listener);
  return () => {
    reachabilityListeners.delete(listener);
  };
}

/**
 * Tries the server a few times, a moment apart, and resolves to whether it answered. Shared, so every
 * request that lost its answer waits for the same verdict. Never rejects.
 */
export function checkServer(): Promise<boolean> {
  checking ??= (async () => {
    for (let tries = 1; ; tries++) {
      if (await canReachServer()) {
        setReachable(true);
        return true;
      }
      if (tries >= CHECKS_BEFORE_OFFLINE) {
        setReachable(false);
        return false;
      }
      await new Promise((resolve) => setTimeout(resolve, CHECK_EVERY_MS));
    }
  })().finally(() => {
    checking = null;
  });
  return checking;
}

interface SendOptions {
  method: string;
  body?: unknown;
  accessToken?: string;
  requestId: string;
  silent: boolean;
  idempotent: boolean;
}

// The query string is left out: a search query can be a person's name.
function requestContext(method: string, path: string) {
  return { method, path: path.split('?')[0] };
}

async function send(path: string, { method, body, accessToken, requestId, silent, idempotent }: SendOptions): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-Request-ID': requestId };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = idempotent ? setTimeout(() => controller.abort(), TIMEOUT_MS) : undefined;
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    setReachable(true);
    const durationMs = Date.now() - startedAt;
    if (!silent && durationMs >= SLOW_RESPONSE_MS) {
      logWarning('slow_api_response', { requestId, context: { ...requestContext(method, path), duration_ms: durationMs } });
    }
    return response;
  } catch (err) {
    if (!silent) {
      logError('api_request_failed', err, { requestId, context: { ...requestContext(method, path), status: 0 } });
    }
    throw new ApiError(0, 'Network request failed', { detail: NETWORK_ERROR_DETAIL, requestId });
  } finally {
    clearTimeout(timeout);
  }
}

// Without an answer the screen keeps loading while the server is tried a few more times, and a request
// that's safe to repeat goes once more if it answers. Once offline, requests fail straight away.
async function sendChecked(path: string, options: SendOptions): Promise<Response> {
  try {
    return await send(path, options);
  } catch (err) {
    if (!reachable) throw err;
    if (await checkServer()) {
      if (options.idempotent) return send(path, options);
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, LEAVE_SCREEN_MS));
    throw err;
  }
}

async function parseJsonOrThrow<T>(response: Response, { method, requestId, silent }: SendOptions, path: string): Promise<T> {
  if (!response.ok) {
    const body: ProblemDetailBody | undefined = await response.json().catch(() => undefined);
    if (!silent) {
      const context = { ...requestContext(method, path), status: response.status };
      if (response.status >= 500) {
        logError('api_request_failed', undefined, { requestId, context });
      } else {
        // Only which fields: the backend's detail can name another user, and the backend logs its own reason.
        const fields = body?.errors ? Object.keys(body.errors).join(',') : undefined;
        logWarning('api_request_rejected', { requestId, context: { ...context, fields } });
      }
    }
    throw new ApiError(response.status, body?.detail ?? `Request failed with status ${response.status}`, {
      detail: body?.detail,
      fieldErrors: body?.errors,
      requestId,
    });
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

interface PublicFetchOptions {
  requestId?: string;
}

/** For endpoints that don't need an access token: register, login, refresh. */
export async function publicFetch<T>(path: string, body?: unknown, options: PublicFetchOptions = {}): Promise<T> {
  const sendOptions: SendOptions = {
    method: 'POST',
    body,
    requestId: options.requestId ?? createRequestId(),
    silent: false,
    idempotent: false,
  };
  return parseJsonOrThrow<T>(await send(path, sendOptions), sendOptions, path);
}

// Requests that 401 at the same time share one refresh.
let refreshPromise: Promise<TokenPair> | null = null;

async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  if (!refreshPromise) {
    refreshPromise = publicFetch<AuthResponse>('/v1/auth/refresh', { refreshToken })
      .then(async (tokens) => {
        await tokenStorage.setTokens(tokens);
        return tokens;
      })
      .catch(async (error) => {
        // Only the backend turning the token away ends the session. No connection or a server
        // error (e.g. mid-deploy) keeps the tokens, so the next try can still refresh.
        if (error instanceof ApiError && error.status === 401) {
          await tokenStorage.clearTokens();
          logWarning('session_expired');
        }
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  /** Set when the caller already logged the request under this id (e.g. "plant_create_submitted"). */
  requestId?: string;
  /** Don't log anything about this request (for the logger's own reports). */
  silent?: boolean;
  /** The backend ignores a repeat, so a slow answer is given up on like a GET's. */
  idempotent?: boolean;
}

/** For everything else: attaches the access token, retries once after a refresh on 401. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const tokens = await tokenStorage.getTokens();
  if (!tokens) {
    throw new ApiError(401, 'Not authenticated');
  }

  // The retry keeps the same id: it's the same thing the user asked for.
  const method = options.method ?? 'GET';
  const sendOptions: SendOptions = {
    method,
    body: options.body,
    requestId: options.requestId ?? createRequestId(),
    silent: options.silent ?? false,
    idempotent: options.idempotent ?? method === 'GET',
  };

  let response = await sendChecked(path, { ...sendOptions, accessToken: tokens.accessToken });

  if (response.status === 401) {
    // A request sent before another one finished refreshing holds the old pair, whose refresh
    // token the backend has already deleted. Retry with the new pair instead of refreshing again.
    const current = await tokenStorage.getTokens();
    const refreshed =
      current && current.refreshToken !== tokens.refreshToken ? current : await refreshTokens(tokens.refreshToken);
    if (!sendOptions.silent) {
      logWarning('request_retried_after_refresh', {
        requestId: sendOptions.requestId,
        context: requestContext(sendOptions.method, path),
      });
    }
    response = await send(path, { ...sendOptions, accessToken: refreshed.accessToken });
  }

  return parseJsonOrThrow<T>(response, sendOptions, path);
}
