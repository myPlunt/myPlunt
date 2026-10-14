import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { WateringLog } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';
import { addMonths, startOfMonth } from './watering-calendar';

/**
 * The user's waterings in one month, for the watering calendar. Starts on the current month
 * and can page back; never past the current month, since there's nothing logged in the future.
 */
export function useWateringCalendar() {
  const { setUnauthenticated } = useAuthStore();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [waterings, setWaterings] = useState<WateringLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount or
  // after the user has already moved on to another month.
  const load = useCallback(
    (isCancelled: () => boolean) => {
      profileService
        .getWaterings(month, addMonths(month, 1))
        .then((result) => {
          if (isCancelled()) return;
          setWaterings(result);
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
    [month, setUnauthenticated],
  );

  // Loads on focus, so waterings logged in the garden in the meantime show up, and again
  // whenever the month changes (load depends on it). useFocusEffect needs a memoized callback.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      load(() => cancelled);
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  function changeMonth(months: number) {
    setIsLoading(true);
    setMonth((current) => addMonths(current, months));
  }

  const isCurrentMonth = month.getTime() === startOfMonth(new Date()).getTime();

  return {
    month,
    waterings,
    error,
    isLoading,
    canShowNextMonth: !isCurrentMonth,
    showPreviousMonth: () => changeMonth(-1),
    showNextMonth: () => {
      if (!isCurrentMonth) changeMonth(1);
    },
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
