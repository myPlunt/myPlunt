import { groupByDay } from '@/features/feed/feed-days';
import type { Post } from '@/lib/post/types';

function post(id: string, createdAt: Date): Post {
  return {
    id,
    type: 'new_plant',
    author: { id: 'u1', username: 'emma', bio: null, avatarUrl: null, friendship: 'friends' },
    plantId: `plant-${id}`,
    plantName: `Plant ${id}`,
    photoUrl: null,
    createdAt: createdAt.toISOString(),
  };
}

describe('groupByDay', () => {
  const now = new Date(2026, 9, 19, 18, 0);

  it('groups the newest-first feed into days, oldest day first and oldest post first, ending with today', () => {
    const feed = [
      post('today-late', new Date(2026, 9, 19, 17, 0)),
      post('today-early', new Date(2026, 9, 19, 9, 0)),
      post('yesterday', new Date(2026, 9, 18, 12, 0)),
      post('older', new Date(2026, 9, 16, 12, 0)),
    ];

    const days = groupByDay(feed, now);

    expect(days.map((day) => [day.label, day.posts.map((p) => p.id)])).toEqual([
      [new Date(2026, 9, 16).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }), ['older']],
      ['Yesterday', ['yesterday']],
      ['Today', ['today-early', 'today-late']],
    ]);
    expect(days.at(-1)!.isToday).toBe(true);
  });

  it('still has today, empty, when nobody posted today', () => {
    expect(groupByDay([], now)).toEqual([{ label: 'Today', isToday: true, posts: [] }]);
  });
});
