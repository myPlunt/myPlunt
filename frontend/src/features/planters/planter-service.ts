import { apiFetch } from '@/lib/auth/api-client';
import type { CreatePlanterRequest, Planter } from '@/lib/planter/types';

export async function createPlanter(request: CreatePlanterRequest): Promise<Planter> {
  return apiFetch<Planter>('/v1/planters', { method: 'POST', body: request });
}
