import { ApiError } from '@/lib/auth/api-client';
import type { AskQuestionRequest } from '@/lib/post/types';
import { useAuthStore } from '@/stores/auth-store';

import * as feedService from './feed-service';

export function useFeedActions() {
  const { setUnauthenticated } = useAuthStore();

  return {
    async askQuestion(request: AskQuestionRequest) {
      try {
        return await feedService.askQuestion(request);
      } catch (err) {
        // apiFetch already tried a refresh; a 401 here means the session is gone.
        if (err instanceof ApiError && err.status === 401) {
          setUnauthenticated();
        }
        throw err;
      }
    },
  };
}
