import { apiFetch } from '@/lib/auth/api-client';
import type { CreatePlantRequest, Plant } from '@/lib/plant/types';

export async function createPlant(request: CreatePlantRequest): Promise<Plant> {
  return apiFetch<Plant>('/v1/plants', { method: 'POST', body: request });
}
