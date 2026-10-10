import { ApiError } from '@/lib/auth/api-client';
import type { CreatePlanterRequest } from '@/lib/planter/types';
import { useAuthStore } from '@/stores/auth-store';

import * as planterService from './planter-service';

export function usePlanterActions() {
  const { setUnauthenticated } = useAuthStore();

  return {
    async createPlanter(request: CreatePlanterRequest) {
      try {
        return await planterService.createPlanter(request);
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
