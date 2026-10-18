import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type { CreatePlanterRequest, Planter, UpdatePlanterRequest } from '@/lib/planter/types';
import { createRequestId } from '@/lib/request-id';

export async function createPlanter(request: CreatePlanterRequest): Promise<Planter> {
  const requestId = createRequestId();
  logAction('planter_create_submitted', { requestId });
  return apiFetch<Planter>('/v1/planters', { method: 'POST', body: request, requestId });
}

export async function renamePlanter(planterId: string, request: UpdatePlanterRequest): Promise<Planter> {
  const requestId = createRequestId();
  logAction('planter_rename_submitted', { requestId, context: { planter_id: planterId } });
  return apiFetch<Planter>(`/v1/planters/${planterId}`, { method: 'PUT', body: request, requestId });
}

/** The planter's plants aren't deleted: the backend moves them to "Other plants". */
export async function deletePlanter(planterId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('planter_delete_submitted', { requestId, context: { planter_id: planterId } });
  return apiFetch<void>(`/v1/planters/${planterId}`, { method: 'DELETE', requestId });
}
