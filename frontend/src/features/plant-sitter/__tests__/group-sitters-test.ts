import type { Sitter } from '@/lib/user/types';

import { groupSitters } from '../group-sitters';

function sitter(username: string, city: string | null, distanceKm: number | null, sameCity = false): Sitter {
  return { user: { id: username, username, bio: null, avatarUrl: null, friendship: 'friends' }, city, distanceKm, sameCity };
}

describe('groupSitters', () => {
  it('groups friends into your city, nearby and the rest, leaving out empty groups', () => {
    const groups = groupSitters([
      sitter('sara', 'Enschede', 1.2, true),
      sitter('lotte', 'Hengelo', 8.4),
      sitter('tom', 'Amsterdam', 140),
      sitter('anna', null, null),
    ]);

    expect(groups.map((g) => [g.title, g.sitters.map((s) => s.user.username)])).toEqual([
      ['In Enschede', ['sara']],
      ['Nearby', ['lotte']],
      ['Other friends', ['tom', 'anna']],
    ]);
  });

  it('puts everyone under other friends when you have no location', () => {
    const groups = groupSitters([sitter('sara', 'Enschede', null), sitter('anna', null, null)]);

    expect(groups.map((g) => g.title)).toEqual(['Other friends']);
  });
});
