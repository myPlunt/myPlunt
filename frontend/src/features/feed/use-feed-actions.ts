import { ApiError } from '@/lib/auth/api-client';
import type { AddCommentRequest, AskQuestionRequest, UpdatePostRequest } from '@/lib/post/types';
import { useAuthStore } from '@/stores/auth-store';

import * as feedService from './feed-service';

export function useFeedActions() {
  const { setUnauthenticated } = useAuthStore();

  async function run<T>(action: () => Promise<T>) {
    try {
      return await action();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUnauthenticated();
      }
      throw err;
    }
  }

  return {
    askQuestion: (request: AskQuestionRequest) => run(() => feedService.askQuestion(request)),
    updatePost: (postId: string, request: UpdatePostRequest) => run(() => feedService.updatePost(postId, request)),
    deletePost: (postId: string) => run(() => feedService.deletePost(postId)),
    waterPost: (postId: string) => run(() => feedService.waterPost(postId)),
    unwaterPost: (postId: string) => run(() => feedService.unwaterPost(postId)),
    addComment: (postId: string, request: AddCommentRequest) => run(() => feedService.addComment(postId, request)),
  };
}
