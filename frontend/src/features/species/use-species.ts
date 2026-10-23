import { useEffect, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Species } from '@/lib/species/types';
import { useAuthStore } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

import * as speciesService from './species-service';

/** Loaded once, not on focus, as the list doesn't change while a screen is open; again after a reconnect. */
export function useSpecies() {
  const { setUnauthenticated } = useAuthStore();
  const [species, setSpecies] = useState<Species[] | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  function retry() {
    setError(null);
    setAttempt((n) => n + 1);
  }
  useReloadOnReconnect(retry);

  return { species, error, retry };
}
