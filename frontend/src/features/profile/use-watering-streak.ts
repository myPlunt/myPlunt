import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError } from '@/lib/auth/api-client';
import { logError } from '@/lib/logger';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';

/**
 * The user's watering streak, for their profile. Null until it has loaded, and also when it
 * couldn't: the streak is a small extra on the profile, so it's left out rather than shown
 * as an error next to the user's details.
 */
export function useWateringStreak() {
  const { setUnauthenticated } = useAuthStore();
  const [streak, setStreak] = useState<number | null>(null);

  // Loads on focus, so waterings logged in the garden in the meantime count. The cancelled
  // flag ignores a response that arrives after blur/unmount.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      profileService
        .getWateringStreak()
        .then((result) => {
          if (!cancelled) setStreak(result.wateringStreak);
        })
        .catch((err) => {
          if (cancelled) return;
          // apiFetch already tried a refresh; a 401 here means the session is gone.
          if (err instanceof ApiError && err.status === 401) {
            setUnauthenticated();
            return;
          }
          // The profile just leaves the streak out, so the user sees nothing went wrong.
          logError('watering_streak_load_failed', err, { requestId: err instanceof ApiError ? err.requestId : undefined });
        });
      return () => {
        cancelled = true;
      };
    }, [setUnauthenticated]),
  );

  return streak;
}
