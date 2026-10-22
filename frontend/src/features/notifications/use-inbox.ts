import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { InboxNotification } from '@/lib/notification/types';
import { useAuthStore } from '@/stores/auth-store';

import { getInbox } from './inbox-service';
import { markInboxSeen } from './use-unread-count';

export function useInbox() {
  const { setUnauthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<InboxNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    (isCancelled: () => boolean) =>
      getInbox()
        .then((result) => {
          if (isCancelled()) return;
          setNotifications(result);
          setError(null);
          // They're on screen now, so the profile's unread count starts over from here.
          markInboxSeen(result);
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
        }),
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
    notifications,
    error,
    isLoading,
    isRefreshing,
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
