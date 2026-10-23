import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { queuedWaterings, sendWaterings, withQueuedHistory } from '@/features/garden/watering-outbox';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { WateringHistory } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

import { cachedWateringHistory } from './offline-pages';

export function useWateringHistory(plantId: string) {
  const { setUnauthenticated } = useAuthStore();
  const [history, setHistory] = useState<WateringHistory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    (isCancelled: () => boolean) => {
      sendWaterings()
        .then(() => Promise.all([cachedWateringHistory(plantId), queuedWaterings()]))
        .then(([result, queued]) => {
          if (isCancelled()) return;
          setHistory(withQueuedHistory(result.data, plantId, queued));
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
    [plantId, setUnauthenticated],
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
