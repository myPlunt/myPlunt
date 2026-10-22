import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { savePlantPagesForOffline } from '@/features/plants/offline-pages';
import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Garden } from '@/lib/garden/types';
import { logBug } from '@/lib/logger';
import { cachedFetch } from '@/lib/offline/cache';
import { useAuthStore } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

import * as gardenService from './garden-service';

// The backend always sends a date; without one the pill would read "In NaN days".
function reportUnusableWateringDates(garden: Garden) {
  const plantIds = garden.rooms
    .flatMap((room) => room.plants)
    .filter((plant) => Number.isNaN(Date.parse(plant.nextWateringAt)))
    .map((plant) => plant.id);
  if (plantIds.length > 0) {
    logBug('unexpected_api_response', {
      context: { endpoint: '/v1/garden', problem: 'invalid_next_watering_at', plant_ids: plantIds.join(',') },
    });
  }
}

export function useGarden(userId?: string) {
  const { setUnauthenticated } = useAuthStore();
  const [garden, setGarden] = useState<Garden | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(
    (isCancelled: () => boolean) => {
      // Only the user's own garden is kept for offline: a friend's needs their profile, which needs the connection.
      const request: Promise<{ data: Garden; savedAt: string | null }> = userId
        ? gardenService.getGarden(userId).then((data) => ({ data, savedAt: null }))
        : cachedFetch('garden', () => gardenService.getGarden());
      return request
        .then((result) => {
          if (!userId && result.savedAt === null) savePlantPagesForOffline(result.data).catch(() => {});
          if (isCancelled()) return;
          // A saved copy was already checked when it was fresh.
          if (result.savedAt === null) reportUnusableWateringDates(result.data);
          setGarden(result.data);
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
    [userId, setUnauthenticated],
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
  useReloadOnReconnect(() => load(() => false));

  return {
    garden,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
    refresh() {
      return load(() => false);
    },
  };
}
