import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { InboxNotification } from '@/lib/notification/types';
import { readCache, writeCache } from '@/lib/offline/cache';

import { getInbox } from './inbox-service';


const SEEN_KEY = 'inbox-seen';

export function markInboxSeen(notifications: InboxNotification[]) {
  if (notifications.length) writeCache(SEEN_KEY, notifications[0].createdAt);
}


export function useUnreadCount() {
  const [count, setCount] = useState(0);

  const load = useCallback(
    (isCancelled: () => boolean) =>
      Promise.all([getInbox(), readCache<string>(SEEN_KEY)])
        .then(([notifications, seen]) => {
          // Compared as dates: the backend's ISO strings don't always have the same number of decimals.
          const seenAt = seen ? Date.parse(seen.data) : -Infinity;
          if (!isCancelled()) setCount(notifications.filter((n) => Date.parse(n.createdAt) > seenAt).length);
        })
        .catch(() => {}),
    [],
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
    count,
    // Pull-to-refresh; 
    refresh: () => load(() => false),
  };
}
