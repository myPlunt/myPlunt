import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type {
  AddPlantPhotoRequest,
  CreatePlantRequest,
  Plant,
  PlantDetails,
  PlantPhoto,
  UpdatePlantPhotoRequest,
  UpdatePlantRequest,
  WateringHistory,
} from '@/lib/plant/types';
import { createRequestId } from '@/lib/request-id';
import { timeZoneQuery } from '@/lib/time-zone';

export async function createPlant(request: CreatePlantRequest): Promise<Plant> {
  const requestId = createRequestId();
  logAction('plant_create_submitted', { requestId, context: { has_photo: request.photoKey !== null } });
  return apiFetch<Plant>('/v1/plants', { method: 'POST', body: request, requestId });
}

/** One of the user's plants, or with ownerId a friend's (the backend turns away anyone else). */
export async function getPlant(plantId: string, ownerId?: string): Promise<PlantDetails> {
  return apiFetch<PlantDetails>(ownerId ? `/v1/users/${ownerId}/plants/${plantId}` : `/v1/plants/${plantId}`);
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

/** The plant's growth photos, oldest first. */
export async function getPlantPhotos(plantId: string, ownerId?: string): Promise<PlantPhoto[]> {
  const path = ownerId ? `/v1/users/${ownerId}/plants/${plantId}` : `/v1/plants/${plantId}`;
  return apiFetch<PlantPhoto[]>(`${path}/photos`);
}

export async function addPlantPhoto(plantId: string, request: AddPlantPhotoRequest): Promise<PlantPhoto> {
  const requestId = createRequestId();
  logAction('plant_photo_add_submitted', {
    requestId,
    context: { plant_id: plantId, has_comment: request.comment !== null },
  });
  return apiFetch<PlantPhoto>(`/v1/plants/${plantId}/photos`, { method: 'POST', body: request, requestId });
}

export async function updatePlantPhoto(
  plantId: string,
  photoId: string,
  request: UpdatePlantPhotoRequest,
): Promise<PlantPhoto> {
  const requestId = createRequestId();
  logAction('plant_photo_update_submitted', { requestId, context: { plant_id: plantId, photo_id: photoId } });
  return apiFetch<PlantPhoto>(`/v1/plants/${plantId}/photos/${photoId}`, { method: 'PUT', body: request, requestId });
}

export async function deletePlantPhoto(plantId: string, photoId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('plant_photo_delete_submitted', { requestId, context: { plant_id: plantId, photo_id: photoId } });
  return apiFetch<void>(`/v1/plants/${plantId}/photos/${photoId}`, { method: 'DELETE', requestId });
}
