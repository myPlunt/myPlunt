import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { WateringLog } from '@/lib/plant/types';
import { useAuthStore } from '@/stores/auth-store';

import * as profileService from './profile-service';
import { addMonths, startOfMonth } from './watering-calendar';

export function useWateringCalendar() {
  const { setUnauthenticated } = useAuthStore();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [waterings, setWaterings] = useState<WateringLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled also drops a response for a month the user has already paged away from.
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
