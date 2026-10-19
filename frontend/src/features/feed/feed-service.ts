import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type { AskQuestionRequest, Post, QuestionPost } from '@/lib/post/types';
import { createRequestId } from '@/lib/request-id';

/** The user's and their friends' posts, newest first. */
export async function getFeed(): Promise<Post[]> {
  return apiFetch<Post[]>('/v1/posts/feed');
}

export async function askQuestion(request: AskQuestionRequest): Promise<QuestionPost> {
  const requestId = createRequestId();
  logAction('question_ask_submitted', { requestId, context: { has_photo: request.photoKey !== null } });
  return apiFetch<QuestionPost>('/v1/posts/questions', { method: 'POST', body: request, requestId });
}
