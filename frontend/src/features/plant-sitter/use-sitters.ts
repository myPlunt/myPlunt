import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { CareRequests, Sitter } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as plantSitterService from './plant-sitter-service';

export function useSitters() {
  const { setUnauthenticated } = useAuthStore();
  const [sitters, setSitters] = useState<Sitter[] | null>(null);
  const [careRequests, setCareRequests] = useState<CareRequests | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (isCancelled: () => boolean) => {
      // Together, so a friend's button and their request never disagree.
      Promise.all([plantSitterService.getSitters(), plantSitterService.getCareRequests()])
        .then(([sittersResult, requestsResult]) => {
          if (isCancelled()) return;
          setSitters(sittersResult);
          setCareRequests(requestsResult);
          setError(null);
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
    sitters,
    careRequests,
    error,
    retry() {
      setError(null);
      load(() => false);
    },
    reload() {
      load(() => false);
    },
  };
}
