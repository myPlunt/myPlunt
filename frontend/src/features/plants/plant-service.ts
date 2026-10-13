import { apiFetch } from '@/lib/auth/api-client';
import type { CreatePlantRequest, Plant, PlantDetails, UpdatePlantRequest, WateringHistory } from '@/lib/plant/types';
import { timeZoneQuery } from '@/lib/time-zone';

export async function createPlant(request: CreatePlantRequest): Promise<Plant> {
  return apiFetch<Plant>('/v1/plants', { method: 'POST', body: request });
}

export async function getPlant(plantId: string): Promise<PlantDetails> {
  return apiFetch<PlantDetails>(`/v1/plants/${plantId}`);
}

export async function updatePlant(plantId: string, request: UpdatePlantRequest): Promise<PlantDetails> {
  return apiFetch<PlantDetails>(`/v1/plants/${plantId}`, { method: 'PUT', body: request });
}

export async function deletePlant(plantId: string): Promise<void> {
  return apiFetch<void>(`/v1/plants/${plantId}`, { method: 'DELETE' });
}

export async function getWateringHistory(plantId: string): Promise<WateringHistory> {
  return apiFetch<WateringHistory>(`/v1/plants/${plantId}/waterings${timeZoneQuery()}`);
}
