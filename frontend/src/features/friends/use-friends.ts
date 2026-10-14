import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { FriendRequests, UserSummary } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as friendsService from './friends-service';

/** The signed-in user's friends and pending requests, for the Friends screen's tabs. */
export function useFriends() {
  const { setUnauthenticated } = useAuthStore();
  const [friends, setFriends] = useState<UserSummary[] | null>(null);
  const [requests, setRequests] = useState<FriendRequests | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) => {
      // Together, so accepting a request moves the person from one list to the other in one go.
      Promise.all([friendsService.getFriends(), friendsService.getFriendRequests()])
        .then(([friendsResult, requestsResult]) => {
          if (isCancelled()) return;
          setFriends(friendsResult);
          setRequests(requestsResult);
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
    [setUnauthenticated],
  );

  // Loads on focus, so answering a request on someone's profile shows here on the way back.
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
    friends,
    requests,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
    /** Loads again behind the current lists, without the spinner, e.g. after answering a request. */
    reload() {
      load(() => false);
    },
  };
}
