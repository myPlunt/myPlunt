import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { queuedWaterings, sendWaterings, withQueuedWaterings } from '@/features/garden/watering-outbox';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { PlantDetails } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

import { cachedPlant } from './offline-pages';
import * as plantService from './plant-service';

export function usePlant(plantId: string, ownerId?: string) {
  const { setUnauthenticated } = useAuthStore();
  const [plant, setPlant] = useState<PlantDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    (isCancelled: () => boolean) => {
      // An own plant sends the queued waterings first; any still queued show as done.
      const request: Promise<PlantDetails> = ownerId
        ? plantService.getPlant(plantId, ownerId)
        : sendWaterings()
            .then(() => Promise.all([cachedPlant(plantId), queuedWaterings()]))
            .then(([result, queued]) => withQueuedWaterings(result.data, queued));
      request
        .then((data) => {
          if (isCancelled()) return;
          setPlant(data);
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
    plant,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
