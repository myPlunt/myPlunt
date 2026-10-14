import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { UserSummary } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as friendsService from './friends-service';

/** Another user, for their profile screen. */
export function useUserProfile(userId: string) {
  const { setUnauthenticated } = useAuthStore();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) => {
      friendsService
        .getUser(userId)
        .then((result) => {
          if (isCancelled()) return;
          setUser(result);
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
    [userId, setUnauthenticated],
  );

  // Loads on focus, so their friendship is fresh whenever the screen is opened again.
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
    user,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
