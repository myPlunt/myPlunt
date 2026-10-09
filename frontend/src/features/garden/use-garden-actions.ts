import { ApiError } from '@/lib/auth/api-client';
import { useAuthStore } from '@/stores/auth-store';

import * as gardenService from './garden-service';

export function useGardenActions() {
  const { setUnauthenticated } = useAuthStore();

  return {
    async waterPlants(plantIds: string[]) {
      try {
        await Promise.all(plantIds.map((plantId) => gardenService.waterPlant(plantId)));
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
