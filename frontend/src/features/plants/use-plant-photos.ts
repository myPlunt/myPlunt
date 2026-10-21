import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { PlantPhoto } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';

import { cachedPlantPhotos } from './offline-pages';

/** The plant's growth photos, oldest first, for its details and growth screens. */
export function usePlantPhotos(plantId: string) {
  const { setUnauthenticated } = useAuthStore();
  const [photos, setPhotos] = useState<PlantPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) => {
      cachedPlantPhotos(plantId)
        .then((result) => {
          if (isCancelled()) return;
          setPhotos(result.data);
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

  // Loads on focus, not just on mount, so a photo added on the add-photo screen shows up.
  // useFocusEffect needs a memoized callback.
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
