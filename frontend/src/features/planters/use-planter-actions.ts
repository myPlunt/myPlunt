import { ApiError } from '@/lib/auth/api-client';
import type { CreatePlanterRequest, UpdatePlanterRequest } from '@/lib/planter/types';
import { useAuthStore } from '@/stores/auth-store';

import * as planterService from './planter-service';

export function usePlanterActions() {
  const { setUnauthenticated } = useAuthStore();

  async function withSession<T>(request: () => Promise<T>) {
    try {
      return await request();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
      }
      throw err;
    }
  }

  return {
    createPlanter(request: CreatePlanterRequest) {
      return withSession(() => planterService.createPlanter(request));
    },
    renamePlanter(planterId: string, request: UpdatePlanterRequest) {
      return withSession(() => planterService.renamePlanter(planterId, request));
    },
    deletePlanter(planterId: string) {
      return withSession(() => planterService.deletePlanter(planterId));
    },
  };
}
