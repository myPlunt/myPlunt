import { apiFetch } from '@/lib/auth/api-client';
import type { CreatePlantRequest, Plant, PlantDetails, UpdatePlantRequest } from '@/lib/plant/types';

export async function createPlant(request: CreatePlantRequest): Promise<Plant> {
  return apiFetch<Plant>('/v1/plants', { method: 'POST', body: request });
}

export async function getPlant(plantId: string): Promise<PlantDetails> {
  return apiFetch<PlantDetails>(`/v1/plants/${plantId}`);
}

export async function updatePlant(plantId: string, request: UpdatePlantRequest): Promise<PlantDetails> {
  return apiFetch<PlantDetails>(`/v1/plants/${plantId}`, { method: 'PUT', body: request });
}
