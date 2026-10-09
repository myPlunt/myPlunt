import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Garden } from '@/lib/garden/types';
import { useAuthStore } from '@/stores/auth-store';

import * as gardenService from './garden-service';

export function useGarden() {
  const { setUnauthenticated } = useAuthStore();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) =>
      gardenService
        .getGarden()
        .then((result) => {
          if (isCancelled()) return;
          setGarden(result);
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
        }),
    [setUnauthenticated],
  );

  // Loads on focus, not just on mount, so the watering status is fresh whenever
  // the user comes back to the garden. useFocusEffect needs a memoized callback.
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
    garden,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
    /** Reloads without the loading state, so the garden stays on screen (e.g. after watering). */
    refresh() {
      return load(() => false);
    },
  };
}
