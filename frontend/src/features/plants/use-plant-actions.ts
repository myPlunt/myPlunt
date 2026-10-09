import { ApiError } from '@/lib/auth/api-client';
import type { CreatePlantRequest } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';

import * as plantService from './plant-service';

export function usePlantActions() {
  const { setUnauthenticated } = useAuthStore();

  return {
    async createPlant(request: CreatePlantRequest) {
      try {
        return await plantService.createPlant(request);
      } catch (err) {
        // apiFetch already tried a refresh; a 401 here means the session is gone.
        if (err instanceof ApiError && err.status === 401) {
          setUnauthenticated();
        }
        throw err;
      }
    },
  };
}
