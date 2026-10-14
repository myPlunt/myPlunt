import { apiFetch } from '@/lib/auth/api-client';
import type { Garden } from '@/lib/garden/types';
import { timeZoneQuery } from '@/lib/time-zone';

export async function getGarden(): Promise<Garden> {
  return apiFetch<Garden>(`/v1/garden${timeZoneQuery()}`);
}

export async function waterPlant(plantId: string): Promise<void> {
  return apiFetch<void>(`/v1/plants/${plantId}/waterings${timeZoneQuery()}`, { method: 'POST' });
}
