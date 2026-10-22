import { apiFetch } from '@/lib/auth/api-client';
import { logAction } from '@/lib/logger';
import type {
  AddCommentRequest,
  AskQuestionRequest,
  Post,
  PostComment,
  QuestionPost,
  UpdatePostRequest,
} from '@/lib/post/types';
import { createRequestId } from '@/lib/request-id';

export async function getFeed(): Promise<Post[]> {
  return apiFetch<Post[]>('/v1/posts/feed');
}

export async function getMyPosts(): Promise<Post[]> {
  return apiFetch<Post[]>('/v1/posts/mine');
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  return apiFetch<Post[]>(`/v1/users/${userId}/posts`);
}

export async function getPost(postId: string): Promise<Post> {
  return apiFetch<Post>(`/v1/posts/${postId}`);
}

export async function askQuestion(request: AskQuestionRequest): Promise<QuestionPost> {
  const requestId = createRequestId();
  logAction('question_ask_submitted', { requestId, context: { has_photo: request.photoKey !== null } });
  return apiFetch<QuestionPost>('/v1/posts/questions', { method: 'POST', body: request, requestId });
}

export async function updatePost(postId: string, request: UpdatePostRequest): Promise<Post> {
  const requestId = createRequestId();
  logAction('post_update_submitted', { requestId, context: { post_id: postId, has_body: request.body !== null } });
  return apiFetch<Post>(`/v1/posts/${postId}`, { method: 'PUT', body: request, requestId });
}

export async function deletePost(postId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('post_delete_submitted', { requestId, context: { post_id: postId } });
  return apiFetch<void>(`/v1/posts/${postId}`, { method: 'DELETE', requestId });
}

export async function getComments(postId: string): Promise<PostComment[]> {
  return apiFetch<PostComment[]>(`/v1/posts/${postId}/comments`);
}

export async function addComment(postId: string, request: AddCommentRequest): Promise<PostComment> {
  const requestId = createRequestId();
  logAction('comment_add_submitted', { requestId, context: { post_id: postId } });
  return apiFetch<PostComment>(`/v1/posts/${postId}/comments`, { method: 'POST', body: request, requestId });
}

export async function waterPost(postId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('post_water_submitted', { requestId, context: { post_id: postId } });
  return apiFetch<void>(`/v1/posts/${postId}/water`, { method: 'PUT', requestId });
}

export async function unwaterPost(postId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('post_unwater_submitted', { requestId, context: { post_id: postId } });
  return apiFetch<void>(`/v1/posts/${postId}/water`, { method: 'DELETE', requestId });
}
