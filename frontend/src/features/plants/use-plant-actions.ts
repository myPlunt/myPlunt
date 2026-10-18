import { ApiError } from '@/lib/auth/api-client';
import type {
  AddPlantPhotoRequest,
  CreatePlantRequest,
  UpdatePlantPhotoRequest,
  UpdatePlantRequest,
} from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';

import * as plantService from './plant-service';

export function usePlantActions() {
  const { setUnauthenticated } = useAuthStore();

  async function withSession<T>(request: () => Promise<T>) {
    try {
      return await request();
    } catch (err) {
      // apiFetch already tried a refresh; a 401 here means the session is gone.
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
      }
      throw err;
    }
  }

  return {
    createPlant(request: CreatePlantRequest) {
      return withSession(() => plantService.createPlant(request));
    },
    updatePlant(plantId: string, request: UpdatePlantRequest) {
      return withSession(() => plantService.updatePlant(plantId, request));
    },
    deletePlant(plantId: string) {
      return withSession(() => plantService.deletePlant(plantId));
    },
    addPlantPhoto(plantId: string, request: AddPlantPhotoRequest) {
      return withSession(() => plantService.addPlantPhoto(plantId, request));
    },
    updatePlantPhoto(plantId: string, photoId: string, request: UpdatePlantPhotoRequest) {
      return withSession(() => plantService.updatePlantPhoto(plantId, photoId, request));
    },
    deletePlantPhoto(plantId: string, photoId: string) {
      return withSession(() => plantService.deletePlantPhoto(plantId, photoId));
    },
  };
}
