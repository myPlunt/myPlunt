import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Post, PostComment } from '@/lib/post/types';
import { useAuthStore } from '@/stores/auth-store';

import * as feedService from './feed-service';

export function usePost(postId: string) {
  const { setUnauthenticated } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(
    (isCancelled: () => boolean) =>
      Promise.all([feedService.getPost(postId), feedService.getComments(postId)])
        .then(([loadedPost, loadedComments]) => {
          if (isCancelled()) return;
          setPost(loadedPost);
          setComments(loadedComments);
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
    [postId, setUnauthenticated],
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
    post,
    comments,
    addLocalComment(comment: PostComment) {
      setComments((current) => [...current, comment]);
    },
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
