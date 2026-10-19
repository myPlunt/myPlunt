import type { Post } from '@/lib/post/types';

export interface FeedDay {
  /** "Today", "Yesterday", "This week", "2 weeks ago", "3 months ago", "1 year ago"... */
  label: string;
  /** Newest first, the way they're read down the vine. */
  posts: Post[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function plural(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
}

/** How long ago a post was, in calendar days in the device's time zone, as the feed's mark. */
export function ageLabel(date: Date, now: Date) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  // Rounded, so a daylight-saving change (a 23- or 25-hour day) still counts as one day.
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return 'This week';
  // Up to 3 weeks; days 28 and 29 still read as 3 weeks, then it's months.
  if (days < 30) return plural(Math.min(Math.floor(days / 7), 3), 'week');
  if (days < 365) return plural(Math.min(Math.floor(days / 30), 11), 'month');
  return plural(Math.floor(days / 365), 'year');
}

/**
 * Groups the feed (newest first, as the backend sends it) by how long ago each post was,
 * newest group first. Today is always there, even without posts, because it heads the vine.
 */
export function groupByAge(posts: Post[], now: Date): FeedDay[] {
  const groups: FeedDay[] = [{ label: 'Today', posts: [] }];
  for (const post of posts) {
    const label = ageLabel(new Date(post.createdAt), now);
    const last = groups[groups.length - 1];
    if (last.label === label) {
      last.posts.push(post);
    } else {
      groups.push({ label, posts: [post] });
    }
  }
  return groups;
}
