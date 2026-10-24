import { apiFetch } from '@/lib/auth/api-client';
import type { Sitter } from '@/lib/user/types';

export async function getSitters(): Promise<Sitter[]> {
  return apiFetch<Sitter[]>('/v1/friends/sitters');
}
