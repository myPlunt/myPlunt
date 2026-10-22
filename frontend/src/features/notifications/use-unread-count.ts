import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { InboxNotification } from '@/lib/notification/types';
import { readCache, writeCache } from '@/lib/offline/cache';

import { getInbox } from './inbox-service';

// When the newest notification the user has seen was sent. Kept with the cache, which is
// cleared on sign-in, so it always belongs to the account that's signed in.
// shortcut: "seen" lives on this device only, so another phone still counts them; move it to
// the server (a seen-at on the user) if people use myPlunt on more than one device.
const SEEN_KEY = 'inbox-seen';

/** Marks everything in the list as seen; called when the notifications list loads. */
export function markInboxSeen(notifications: InboxNotification[]) {
  if (notifications.length) writeCache(SEEN_KEY, notifications[0].createdAt);
}

/**
 * How many notifications arrived since the list was last opened, loaded on focus so it drops
 * to zero when the user comes back from it. Stays 0 when it can't be loaded: it's only a hint.
 */
export function useUnreadCount() {
  const [count, setCount] = useState(0);

  // useFocusEffect needs a memoized callback.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      // shortcut: loads the whole inbox (capped by the backend) to count it; add a count endpoint if it gets slow.
      Promise.all([getInbox(), readCache<string>(SEEN_KEY)])
        .then(([notifications, seen]) => {
          // Compared as dates: the backend's ISO strings don't always have the same number of decimals.
          const seenAt = seen ? Date.parse(seen.data) : -Infinity;
          if (!cancelled) setCount(notifications.filter((n) => Date.parse(n.createdAt) > seenAt).length);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return count;
}
