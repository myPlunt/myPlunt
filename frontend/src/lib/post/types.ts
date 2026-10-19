import type { UserSummary } from '@/lib/user/types';

interface BasePost {
  id: string;
  /** `friendship` is null when the post is the signed-in user's own. */
  author: UserSummary;
  /** Short-lived link to the post's photo; null when there's none. */
  photoUrl: string | null;
  createdAt: string;
}

/** A shared new plant (with the plant's current photo) or a new photo of a plant. */
export interface PlantPost extends BasePost {
  type: 'new_plant' | 'new_photo';
  plantId: string;
  plantName: string;
  body: null;
}

/** A question for friends, shown as a sticky note; not about a plant. */
export interface QuestionPost extends BasePost {
  type: 'question';
  plantId: null;
  plantName: null;
  body: string;
}

/** Mirrors PostResponse (GET /v1/posts/feed): one post by the user or a friend. */
export type Post = PlantPost | QuestionPost;

/** Mirrors AskQuestionRequest (POST /v1/posts/questions). */
export interface AskQuestionRequest {
  body: string;
  /** Key from uploading a photo with category POST; null for no photo. */
  photoKey: string | null;
}
