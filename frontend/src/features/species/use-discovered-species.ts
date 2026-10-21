import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { DiscoveredSpecies } from '@/lib/species/types';
import { useAuthStore } from '@/stores/auth-store';

import * as speciesService from './species-service';

/**
 * The species the user has discovered, and when. Reloads on focus, so a plant added from
 * the tab bar (or from a species' page) counts as soon as the user comes back to the Pluntdex.
 * With userId, a friend's discoveries, for their profile.
 */
export function useDiscoveredSpecies(userId?: string) {
  const { setUnauthenticated } = useAuthStore();
  const [discovered, setDiscovered] = useState<DiscoveredSpecies[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
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
    [userId, setUnauthenticated],
  );

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
