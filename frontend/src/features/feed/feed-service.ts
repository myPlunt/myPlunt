import { apiFetch } from '@/lib/auth/api-client';
import type { Post } from '@/lib/post/types';

/** The user's and their friends' posts, newest first. */
export async function getFeed(): Promise<Post[]> {
  return apiFetch<Post[]>('/v1/posts/feed');
}
