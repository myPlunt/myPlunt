import { hash } from './feed-sides';

export const NOTE_COLORS = ['bg-note-green', 'bg-note-yellow', 'bg-note-orange', 'bg-note-pink', 'bg-note-teal'];

export function noteColor(postId: string) {
  // >>> 0 makes the hash non-negative, so it's a valid index.
  return NOTE_COLORS[(hash(postId) >>> 0) % NOTE_COLORS.length];
}

export function noteTilt(postId: string) {
  return ((hash(postId) >>> 0) % 7) - 3;
}
