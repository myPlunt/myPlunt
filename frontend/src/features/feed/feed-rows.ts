import type { Side } from './feed-sides';

export interface FeedRow {
  id: string;
  side: Side;
}

export interface RowOffsets {
  marginTops: number[];
  paddingBottom: number;
}

/**
 * Where each post starts, from the heights measured so far. A post on the other side from the one
 * before starts a gap past its middle, and two gaps below the last post on its own side.
 */
export function rowOffsets(rows: FeedRow[], heights: Map<string, number>, gap: number): RowOffsets {
  const marginTops: number[] = [];
  const sideBottom: Record<Side, number> = { left: -Infinity, right: -Infinity };
  let previousTop = 0;
  let previousBottom = 0;
  rows.forEach((row, i) => {
    const height = heights.get(row.id) ?? 0;
    let top = 0;
    if (i > 0) {
      const previous = rows[i - 1];
      top =
        row.side === previous.side
          ? previousBottom + gap
          : Math.max(previousTop + (heights.get(previous.id) ?? 0) / 2 + gap, sideBottom[row.side] + 2 * gap);
    }
    marginTops.push(i === 0 ? 0 : top - previousBottom);
    previousTop = top;
    previousBottom = top + height;
    sideBottom[row.side] = Math.max(sideBottom[row.side], previousBottom);
  });
  const lowest = Math.max(sideBottom.left, sideBottom.right, previousBottom);
  return { marginTops, paddingBottom: rows.length === 0 ? 0 : lowest - previousBottom };
}
