import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Post } from '@/lib/post/types';
import { useAuthStore } from '@/stores/auth-store';
import { useReloadOnReconnect } from '@/stores/network-store';

export function useFeed(fetchPosts: () => Promise<Post[]>) {
  const { setUnauthenticated } = useAuthStore();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    posts,
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
