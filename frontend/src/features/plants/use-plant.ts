import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { PlantDetails } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';

import { cachedPlant } from './offline-pages';

/** One of the user's plants, for its details and edit screens. */
export function usePlant(plantId: string) {
  const { setUnauthenticated } = useAuthStore();
  const [plant, setPlant] = useState<PlantDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) => {
      cachedPlant(plantId)
        .then((result) => {
          if (isCancelled()) return;
          setPlant(result.data);
          setError(null);
        })
        .catch((err) => {
          if (isCancelled()) return;
          // apiFetch already tried a refresh; a 401 here means the session is gone.
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
    [plantId, setUnauthenticated],
  );

  // Loads on focus, not just on mount, so coming back from the edit screen shows the
  // saved changes and a fresh watering status. useFocusEffect needs a memoized callback.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

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
