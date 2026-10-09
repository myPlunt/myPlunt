import { useEffect, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { User } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';

export function useProfile() {
  const { setUnauthenticated } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Ignore a response that arrives after unmount or after a newer retry.
    let cancelled = false;

    profileService
      .getCurrentUser()
      .then((result) => {
        if (!cancelled) setUser(result);
      })
      .catch((err) => {
        if (cancelled) return;
        // apiFetch already tried a refresh; a 401 here means the session is gone.
        if (err instanceof ApiError && err.status === 401) {
          setUnauthenticated();
          return;
        }
        setError(describeError(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt, setUnauthenticated]);

  return {
    user,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      setAttempt((n) => n + 1);
    },
  };
}
