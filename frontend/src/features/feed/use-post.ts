import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { Post, PostComment } from '@/lib/post/types';
import { useAuthStore } from '@/stores/auth-store';

import * as feedService from './feed-service';

/** One post and its comments, for its own page. */
export function usePost(postId: string) {
  const { setUnauthenticated } = useAuthStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // isCancelled lets a focus effect ignore a response that arrives after blur/unmount.
  const load = useCallback(
    (isCancelled: () => boolean) => {
      Promise.all([feedService.getPost(postId), feedService.getComments(postId)])
        .then(([loadedPost, loadedComments]) => {
          if (isCancelled()) return;
          setPost(loadedPost);
          setComments(loadedComments);
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
    [postId, setUnauthenticated],
  );

  // Loads on focus, so the post is fresh whenever the page is opened again.
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
    /** Shows a comment the user just added without loading the page again. */
    addLocalComment(comment: PostComment) {
      setComments((current) => [...current, comment]);
    },
    error,
    isLoading,
    retry() {
      setError(null);
      setIsLoading(true);
      load(() => false);
    },
  };
}
