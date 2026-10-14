import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type { CreatePlantRequest, Plant, PlantDetails, UpdatePlantRequest, WateringHistory } from '@/lib/plant/types';
import { createRequestId } from '@/lib/request-id';
import { timeZoneQuery } from '@/lib/time-zone';

export async function createPlant(request: CreatePlantRequest): Promise<Plant> {
  const requestId = createRequestId();
  logAction('plant_create_submitted', { requestId, context: { has_photo: request.photoKey !== null } });
  return apiFetch<Plant>('/v1/plants', { method: 'POST', body: request, requestId });
}

export async function getPlant(plantId: string): Promise<PlantDetails> {
  return apiFetch<PlantDetails>(`/v1/plants/${plantId}`);
}

export async function updatePlant(plantId: string, request: UpdatePlantRequest): Promise<PlantDetails> {
  const requestId = createRequestId();
  logAction('plant_update_submitted', { requestId, context: { plant_id: plantId } });
  return apiFetch<PlantDetails>(`/v1/plants/${plantId}`, { method: 'PUT', body: request, requestId });
}

export async function deletePlant(plantId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('plant_delete_submitted', { requestId, context: { plant_id: plantId } });
  return apiFetch<void>(`/v1/plants/${plantId}`, { method: 'DELETE', requestId });
}

export async function getWateringHistory(plantId: string): Promise<WateringHistory> {
  return apiFetch<WateringHistory>(`/v1/plants/${plantId}/waterings${timeZoneQuery()}`);
}
