import { publicFetch } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { AuthResponse, LoginRequest, RegisterRequest } from '@/lib/auth/types';

export async function login(credentials: LoginRequest): Promise<void> {
  const tokens = await publicFetch<AuthResponse>('/v1/auth/login', credentials);
  await tokenStorage.setTokens(tokens);
}

export async function register(details: RegisterRequest): Promise<void> {
  const tokens = await publicFetch<AuthResponse>('/v1/auth/register', details);
  await tokenStorage.setTokens(tokens);
}

export async function logout(): Promise<void> {
  const tokens = await tokenStorage.getTokens();
  await tokenStorage.clearTokens();
  if (tokens) {
    publicFetch('/v1/auth/logout', { refreshToken: tokens.refreshToken }).catch(() => {});
  }
}
