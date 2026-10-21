import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { InboxNotification } from '@/lib/notification/types';
import { useAuthStore } from '@/stores/auth-store';

import { getInbox } from './inbox-service';

/** The user's notifications list, loaded on focus so new ones show when they come back. */
export function useInbox() {
  const { setUnauthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<InboxNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) =>
      getInbox()
        .then((result) => {
          if (isCancelled()) return;
          setNotifications(result);
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
        }),
    [setUnauthenticated],
  );

  // useFocusEffect needs a memoized callback.
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
    notifications,
    error,
    isLoading,
    isRefreshing,
    // Pull-to-refresh: keeps the list on screen while the new one loads.
    refresh() {
      setIsRefreshing(true);
      return load(() => false).finally(() => setIsRefreshing(false));
    },
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
