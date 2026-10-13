import { useEffect, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Species } from '@/lib/species/types';
import { useAuthStore } from '@/stores/auth-store';

import * as speciesService from './species-service';

/**
 * The approved species, loaded once: unlike the garden, the list doesn't change while a screen
 * is open. retry loads it again after an error.
 */
export function useSpecies() {
  const { setUnauthenticated } = useAuthStore();
  const [species, setSpecies] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped by retry to run the effect again.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    speciesService
      .getSpecies()
      .then((result) => {
        if (!cancelled) setSpecies(result);
      })
      .catch((err) => {
        if (cancelled) return;
        // apiFetch already tried a refresh; a 401 here means the session is gone.
        if (err instanceof ApiError && err.status === 401) {
          setUnauthenticated();
          return;
        }
        setError(describeError(err));
      });
    return () => {
      cancelled = true;
    };
  }, [setUnauthenticated, attempt]);

  return {
    species,
    error,
    retry() {
      setError(null);
      setAttempt((n) => n + 1);
    },
  };
}
