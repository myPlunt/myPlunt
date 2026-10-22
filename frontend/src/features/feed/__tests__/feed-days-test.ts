import { ageLabel, groupByAge } from '@/features/feed/feed-days';
import type { PlantPost } from '@/lib/post/types';

function post(id: string, createdAt: Date): PlantPost {
  return {
    id,
    type: 'new_plant',
    author: { id: 'u1', username: 'emma', bio: null, avatarUrl: null, friendship: 'friends' },
    plantId: `plant-${id}`,
    plantName: `Plant ${id}`,
    body: null,
    photoUrl: null,
    commentCount: 0,
    waterCount: 0,
    wateredByMe: false,
    createdAt: createdAt.toISOString(),
  };
}

describe('feed days', () => {
  const now = new Date(2026, 9, 19, 18, 0);
  const daysAgo = (days: number) => new Date(2026, 9, 19 - days, 12, 0);

  it('labels a post by how long ago it was, from today up to years', () => {
    expect(
      [0, 1, 3, 6, 7, 13, 14, 29, 30, 75, 364, 365, 800].map((days) => ageLabel(daysAgo(days), now)),
    ).toEqual([
      'Today',
      'Yesterday',
      'This week',
      'This week',
      '1 week ago',
      '1 week ago',
      '2 weeks ago',
      '3 weeks ago',
      '1 month ago',
      '2 months ago',
      '11 months ago',
      '1 year ago',
      '2 years ago',
    ]);
  });

  it('groups the newest-first feed under its marks, starting with today, even when nobody posted today', () => {
    const feed = [post('yesterday', daysAgo(1)), post('tuesday', daysAgo(3)), post('monday', daysAgo(4))];

    expect(groupByAge(feed, now).map((group) => [group.label, group.posts.map((p) => p.id)])).toEqual([
      ['Today', []],
      ['Yesterday', ['yesterday']],
      ['This week', ['tuesday', 'monday']],
    ]);
  });
});
