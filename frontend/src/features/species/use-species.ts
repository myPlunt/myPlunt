import { useEffect, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Species } from '@/lib/species/types';
import { useAuthStore } from '@/stores/auth-store';

import * as speciesService from './species-service';

/** The approved species, loaded once: unlike the garden, the list doesn't change while a screen is open. */
export function useSpecies() {
  const { setUnauthenticated } = useAuthStore();
  const [species, setSpecies] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [setUnauthenticated]);

  return { species, error };
}
