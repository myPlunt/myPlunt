import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { DiscoveredSpecies } from '@/lib/species/types';
import { useAuthStore } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

import * as speciesService from './species-service';

export function useDiscoveredSpecies(userId?: string) {
  const { setUnauthenticated } = useAuthStore();
  const [discovered, setDiscovered] = useState<DiscoveredSpecies[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    (isCancelled: () => boolean) =>
      speciesService
        .getDiscoveredSpecies(userId)
        .then((result) => {
          if (isCancelled()) return;
          setDiscovered(result);
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
        }),
    [userId, setUnauthenticated],
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
    discovered,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
    refresh() {
      return load(() => false);
    },
  };
}
