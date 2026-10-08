import { tokenStorage, type TokenPair } from './token-storage';
import type { AuthResponse } from './types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// The backend only gives us a status code, so screens map it to copy themselves.
export function describeError(error: unknown, statusMessages: Record<number, string>): string {
  if (error instanceof ApiError && statusMessages[error.status]) {
    return statusMessages[error.status];
  }
  return 'Something went wrong. Please try again.';
}

async function parseJsonOrThrow<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // The backend doesn't echo exception messages in the error body (no
    // server.error.include-message), so the status code is all we get.
    throw new ApiError(response.status, `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

/** For endpoints that don't need an access token: register, login, refresh. */
export async function publicFetch<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return parseJsonOrThrow<T>(response);
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
}

/** For everything else: attaches the access token, retries once after a refresh on 401. */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const tokens = await tokenStorage.getTokens();
  if (!tokens) {
    throw new ApiError(401, 'Not authenticated');
  }

  const makeRequest = (accessToken: string) =>
    fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

  let response = await makeRequest(tokens.accessToken);

  if (response.status === 401) {
    const refreshed = await refreshTokens(tokens.refreshToken);
    response = await makeRequest(refreshed.accessToken);
  }

  return parseJsonOrThrow<T>(response);
}
