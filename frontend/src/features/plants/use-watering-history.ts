import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { WateringHistory } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';

import * as plantService from './plant-service';

/** Every watering of one plant, for its watering history screen. */
export function useWateringHistory(plantId: string) {
  const { setUnauthenticated } = useAuthStore();
  const [history, setHistory] = useState<WateringHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) => {
      plantService
        .getWateringHistory(plantId)
        .then((result) => {
          if (isCancelled()) return;
          setHistory(result);
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

  // Loads on focus, not just on mount, so a watering logged in the garden in the meantime
  // shows up. useFocusEffect needs a memoized callback.
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
    history,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
