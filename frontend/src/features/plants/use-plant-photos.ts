import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { PlantPhoto } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

import { cachedPlantPhotos } from './offline-pages';
import * as plantService from './plant-service';

export function usePlantPhotos(plantId: string, ownerId?: string) {
  const { setUnauthenticated } = useAuthStore();
  const [photos, setPhotos] = useState<PlantPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    (isCancelled: () => boolean) => {
      const request: Promise<{ data: PlantPhoto[] }> = ownerId
        ? plantService.getPlantPhotos(plantId, ownerId).then((data) => ({ data }))
        : cachedPlantPhotos(plantId);
      request
        .then((result) => {
          if (isCancelled()) return;
          setPhotos(result.data);
          setError(null);
        })
        .catch((err) => {
          if (isCancelled()) return;
          if (err instanceof ApiError && err.status === 401) {
            setUnauthenticated();
            return;
          }
          setError(describeError(err));
        })
        .finally(() => {
          if (!isCancelled()) setIsLoading(false);
        });
    },
    [plantId, ownerId, setUnauthenticated],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [load]),
  );
  useReloadOnReconnect(() => load(() => false));

  return {
    photos,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
