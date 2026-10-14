import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type { CreatePlanterRequest, Planter } from '@/lib/planter/types';
import { createRequestId } from '@/lib/request-id';

export async function createPlanter(request: CreatePlanterRequest): Promise<Planter> {
  const requestId = createRequestId();
  logAction('planter_create_submitted', { requestId });
  return apiFetch<Planter>('/v1/planters', { method: 'POST', body: request, requestId });
}
