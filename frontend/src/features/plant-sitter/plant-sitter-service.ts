import { apiFetch } from '@/lib/auth/api-client';
import type { CareRequests, Sitter } from '@/lib/user/types';

export async function getSitters(): Promise<Sitter[]> {
  return apiFetch<Sitter[]>('/v1/friends/sitters');
}

export async function getCareRequests(): Promise<CareRequests> {
  return apiFetch<CareRequests>('/v1/care-requests');
}

export async function sendCareRequest(sitterId: string, from: Date, until: Date): Promise<void> {
  return apiFetch<void>('/v1/care-requests', {
    method: 'POST',
    body: { sitterId, from: from.toISOString(), until: until.toISOString() },
  });
}

export async function acceptCareRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/care-requests/${userId}/accept`, { method: 'POST' });
}

export async function declineCareRequest(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/care-requests/${userId}/decline`, { method: 'POST' });
}
