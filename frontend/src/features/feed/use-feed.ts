import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Post } from '@/lib/post/types';
import { useAuthStore } from '@/stores/auth-store';

/** Loads a list of posts on focus: the feed (getFeed) or the user's own (getMyPosts). */
export function useFeed(fetchPosts: () => Promise<Post[]>) {
  const { setUnauthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) =>
      fetchPosts()
        .then((result) => {
          if (isCancelled()) return;
          setPosts(result);
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
    [fetchPosts, setUnauthenticated],
  );

  // Loads on focus, so a plant just added (and shared) is there when the user comes back.
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
    posts,
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
