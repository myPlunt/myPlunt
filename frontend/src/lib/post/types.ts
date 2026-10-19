import type { UserSummary } from '@/lib/user/types';

/** Mirrors the backend's Post constants: a shared new plant, or a new photo of a plant. */
export type PostType = 'new_plant' | 'new_photo';

/** Mirrors PostResponse (GET /v1/posts/feed): one post by the user or a friend. */
export interface Post {
  id: string;
  type: PostType;
  /** `friendship` is null when the post is the signed-in user's own. */
  author: UserSummary;
  plantId: string;
  plantName: string;
  /** Short-lived link to the shared photo, or a new plant's current one; null when there's none. */
  photoUrl: string | null;
  createdAt: string;
}
