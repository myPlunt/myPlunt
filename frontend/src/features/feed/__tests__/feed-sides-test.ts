import { feedSides } from '@/features/feed/feed-sides';

const ids = Array.from({ length: 200 }, (_, i) => `post-${i}`);

describe('feedSides', () => {
  it('never puts more than three posts in a row on the same side, but uses both sides', () => {
    const sides = feedSides(ids);

    for (let i = 3; i < sides.length; i++) {
      expect(sides.slice(i - 3, i + 1).every((side) => side === sides[i])).toBe(false);
    }
    expect(sides).toContain('left');
    expect(sides).toContain('right');
  });

  it('keeps the same sides for the same posts, so cards do not jump on refresh', () => {
    expect(feedSides(ids)).toEqual(feedSides(ids));
  });
});
