import type { Post } from '@/lib/post/types';

export interface FeedDay {
  /** "Today", "Yesterday", or the date ("Thu 16 Oct"). */
  label: string;
  isToday: boolean;
  /** Oldest first, the way they grow up the vine. */
  posts: Post[];
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date: Date, now: Date) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(date) === dayKey(now)) return 'Today';
  if (dayKey(date) === dayKey(yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

/**
 * Groups the feed (newest first, as the backend sends it) into days in the device's time
 * zone, oldest day first, so it reads bottom-up from today like the vine grows. Today is
 * always there, even without posts, because its mark sits at the vine's base.
 */
export function groupByDay(posts: Post[], now: Date): FeedDay[] {
  const days = new Map<string, FeedDay>([[dayKey(now), { label: 'Today', isToday: true, posts: [] }]]);
  for (const post of [...posts].reverse()) {
    const date = new Date(post.createdAt);
    const key = dayKey(date);
    if (!days.has(key)) {
      days.set(key, { label: dayLabel(date, now), isToday: false, posts: [] });
    }
    days.get(key)!.posts.push(post);
  }
  // Today was added first so it always exists; it belongs at the end (the bottom).
  const today = days.get(dayKey(now))!;
  days.delete(dayKey(now));
  return [...days.values(), today];
}
