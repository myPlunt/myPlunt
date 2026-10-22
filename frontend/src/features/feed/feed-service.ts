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

/** The user's and their friends' posts, newest first. */
export async function getFeed(): Promise<Post[]> {
  return apiFetch<Post[]>('/v1/posts/feed');
}

/** The user's own posts, newest first. */
export async function getMyPosts(): Promise<Post[]> {
  return apiFetch<Post[]>('/v1/posts/mine');
}

/** A friend's posts, newest first, for their profile (the backend turns away anyone else). */
export async function getUserPosts(userId: string): Promise<Post[]> {
  return apiFetch<Post[]>(`/v1/users/${userId}/posts`);
}

/** One post of the user's or a friend's, for its own page. */
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

/** Removes only the post; a shared plant or photo stays in the garden. */
export async function deletePost(postId: string): Promise<void> {
  const requestId = createRequestId();
  logAction('post_delete_submitted', { requestId, context: { post_id: postId } });
  return apiFetch<void>(`/v1/posts/${postId}`, { method: 'DELETE', requestId });
}

/** A post's comments, oldest first. */
export async function getComments(postId: string): Promise<PostComment[]> {
  return apiFetch<PostComment[]>(`/v1/posts/${postId}/comments`);
}

export async function addComment(postId: string, request: AddCommentRequest): Promise<PostComment> {
  const requestId = createRequestId();
  logAction('comment_add_submitted', { requestId, context: { post_id: postId } });
  return apiFetch<PostComment>(`/v1/posts/${postId}/comments`, { method: 'POST', body: request, requestId });
}
