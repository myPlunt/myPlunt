import { useCallback, useEffect, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Sitter } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as plantSitterService from './plant-sitter-service';

export function useSitters() {
  const { setUnauthenticated } = useAuthStore();
  const [sitters, setSitters] = useState<Sitter[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (isCancelled: () => boolean) => {
      plantSitterService
        .getSitters()
        .then((result) => {
          if (!isCancelled()) setSitters(result);
        })
        .catch((err) => {
          if (isCancelled()) return;
          if (err instanceof ApiError && err.status === 401) {
            setUnauthenticated();
            return;
          }
          setError(describeError(err));
        });
    },
    [setUnauthenticated],
  );

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  return {
    sitters,
    error,
    retry() {
      setError(null);
      load(() => false);
    },
  };
}
