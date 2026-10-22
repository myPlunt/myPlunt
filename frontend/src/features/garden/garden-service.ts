import { apiFetch } from '@/lib/auth/api-client';
import type { Garden } from '@/lib/garden/types';
import { logAction } from '@/lib/logger';
import { createRequestId } from '@/lib/request-id';
import { timeZoneQuery } from '@/lib/time-zone';

export async function getGarden(userId?: string): Promise<Garden> {
  const path = userId ? `/v1/users/${userId}/garden` : '/v1/garden';
  return apiFetch<Garden>(`${path}${timeZoneQuery()}`);
}

export async function waterPlant(plantId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('watering_submitted', { requestId, context: { plant_id: plantId } });
  return apiFetch<void>(`/v1/plants/${plantId}/waterings${timeZoneQuery()}`, { method: 'POST', requestId });
}
