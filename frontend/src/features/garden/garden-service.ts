import { apiFetch } from '@/lib/auth/api-client';
import type { Garden } from '@/lib/garden/types';

export async function getGarden(): Promise<Garden> {
  return apiFetch<Garden>('/v1/garden');
}

export async function waterPlant(plantId: string): Promise<void> {
  return apiFetch<void>(`/v1/plants/${plantId}/waterings`, { method: 'POST' });
}
