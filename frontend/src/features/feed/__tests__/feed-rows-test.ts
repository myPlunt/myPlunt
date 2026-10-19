import { rowOffsets } from '@/features/feed/feed-rows';

const GAP = 16;

describe('rowOffsets', () => {
  it('starts a post on the other side a gap past the middle of the one before, and one on the same side below it', () => {
    const heights = new Map([
      ['a', 200],
      ['b', 100],
      ['c', 120],
    ]);

    const { marginTops } = rowOffsets(
      [
        { id: 'a', side: 'right' },
        { id: 'b', side: 'left' },
        { id: 'c', side: 'left' },
      ],
      heights,
      GAP,
    );

    // b starts at 116 (half of a, plus a gap), right after a's bottom at 200: pulled up 84.
    // c is on b's side, so it goes a gap below b.
    expect(marginTops).toEqual([0, -84, GAP]);
  });

  it('keeps two gaps to the last post on its own side when one on the other side is in between', () => {
    const heights = new Map([
      ['tall', 300],
      ['short', 40],
      ['next', 100],
    ]);

    const { marginTops, paddingBottom } = rowOffsets(
      [
        { id: 'tall', side: 'right' },
        { id: 'short', side: 'left' },
        { id: 'next', side: 'right' },
      ],
      heights,
      GAP,
    );

    // short starts at 166 (half of tall, plus a gap) and ends at 206; next would start at 202
    // (half of short, plus a gap) but tall, on its side, ends at 300, so it starts at 332.
    expect(marginTops).toEqual([0, -134, 332 - 206]);
    expect(paddingBottom).toBe(0);
    // With only the tall and the short one, the short ends first: room is left below it.
    expect(
      rowOffsets(
        [
          { id: 'tall', side: 'right' },
          { id: 'short', side: 'left' },
        ],
        heights,
        GAP,
      ).paddingBottom,
    ).toBe(300 - 206);
  });
});
