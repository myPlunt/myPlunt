import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError } from '@/lib/auth/api-client';
import { logError } from '@/lib/logger';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';

/** Null until loaded, and when it couldn't be: the profile leaves it out rather than show an error. */
export function useWateringStreak() {
  const { setUnauthenticated } = useAuthStore();
  const [streak, setStreak] = useState<number | null>(null);

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
          if (err instanceof ApiError && err.status === 401) {
            setUnauthenticated();
            return;
          }
          logError('watering_streak_load_failed', err, { requestId: err instanceof ApiError ? err.requestId : undefined });
        });
      return () => {
        cancelled = true;
      };
    }, [setUnauthenticated]),
  );

  return streak;
}
