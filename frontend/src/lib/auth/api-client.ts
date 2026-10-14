import { logError } from '@/lib/logger';

import { tokenStorage, type TokenPair } from './token-storage';
import type { AuthResponse } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  /** The backend's ProblemDetail "detail" — a message already written to be user-safe. */
  detail?: string;
  /** Per-field bean-validation messages, keyed by field name, when the backend sent any. */
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, options?: { detail?: string; fieldErrors?: Record<string, string> }) {
    super(message);
    this.status = status;
    this.detail = options?.detail;
    this.fieldErrors = options?.fieldErrors;
  }
}

// Prefers the backend's own message; statusMessages is only a fallback for
// statuses where the backend doesn't send a useful detail (e.g. 500).
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

// silent skips logging the failure; only the logger's own reports use it.
async function send(path: string, init: RequestInit, silent = false): Promise<Response> {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch (err) {
    if (!silent) logError(`${init.method} ${path} got no response (is the backend running at ${API_BASE_URL}?)`, err);
    throw new ApiError(0, 'Network request failed', { detail: NETWORK_ERROR_DETAIL });
  }
}

async function parseJsonOrThrow<T>(response: Response, request: string, silent = false): Promise<T> {
  if (!response.ok) {
    const body: ProblemDetailBody | undefined = await response.json().catch(() => undefined);
    if (!silent) logError(`${request} failed with ${response.status}`, body);
    throw new ApiError(response.status, body?.detail ?? `Request failed with status ${response.status}`, {
      detail: body?.detail,
      fieldErrors: body?.errors,
    });
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

/** For endpoints that don't need an access token: register, login, refresh. */
export async function publicFetch<T>(path: string, body?: unknown): Promise<T> {
  const response = await send(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseJsonOrThrow<T>(response, `POST ${path}`);
}

// Multiple requests can 401 at once, so share one 
// in-flight refresh instead of hitting /auth/refresh once per request.
let refreshPromise: Promise<TokenPair> | null = null;

async function refreshTokens(refreshToken: string): Promise<TokenPair> {
  if (!refreshPromise) {
    refreshPromise = publicFetch<AuthResponse>('/v1/auth/refresh', { refreshToken })
      .then(async (tokens) => {
        await tokenStorage.setTokens(tokens);
        return tokens;
      })
      .catch(async (error) => {
        await tokenStorage.clearTokens();
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
  /** Don't log a failure of this request (for the logger's own reports). */
  silent?: boolean;
}

/** For everything else: attaches the access token, retries once after a refresh on 401. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const tokens = await tokenStorage.getTokens();
  if (!tokens) {
    throw new ApiError(401, 'Not authenticated');
  }

  const method = options.method ?? 'GET';
  const makeRequest = (accessToken: string) =>
    send(path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    }, options.silent);

  let response = await makeRequest(tokens.accessToken);

  if (response.status === 401) {
    const refreshed = await refreshTokens(tokens.refreshToken);
    response = await makeRequest(refreshed.accessToken);
  }

  return parseJsonOrThrow<T>(response, `${method} ${path}`, options.silent);
}
