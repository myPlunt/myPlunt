import { hash } from './feed-sides';

/** The sticky-note colours, as classes; see the note* colours in tokens.ts. */
export const NOTE_COLORS = ['bg-note-green', 'bg-note-yellow', 'bg-note-orange', 'bg-note-pink', 'bg-note-teal'];

/** A question's note colour: random per post, but the same every time it's shown. */
export function noteColor(postId: string) {
  // >>> 0 makes the hash non-negative, so it's a valid index.
  return NOTE_COLORS[(hash(postId) >>> 0) % NOTE_COLORS.length];
}
