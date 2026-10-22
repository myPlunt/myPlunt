import type { UserSummary } from '@/lib/user/types';

interface BasePost {
  id: string;
  /** `friendship` is null when the post is the signed-in user's own. */
  author: UserSummary;
  photoUrl: string | null;
  commentCount: number;
  /** Drops of water are the app's likes. */
  waterCount: number;
  wateredByMe: boolean;
  createdAt: string;
}

export interface PlantPost extends BasePost {
  type: 'new_plant' | 'new_photo';
  plantId: string;
  plantName: string;
  body: string | null;
}

export interface QuestionPost extends BasePost {
  type: 'question';
  plantId: null;
  plantName: null;
  body: string;
}

export type Post = PlantPost | QuestionPost;

export interface UpdatePostRequest {
  body: string | null;
}

export interface AskQuestionRequest {
  body: string;
  photoKey: string | null;
}

/** `author.friendship` is always null here. */
export interface PostComment {
  id: string;
  author: UserSummary;
  body: string;
  createdAt: string;
}

export interface AddCommentRequest {
  body: string;
}
