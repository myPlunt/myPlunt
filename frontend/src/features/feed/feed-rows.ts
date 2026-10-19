import type { Side } from './feed-sides';

export interface FeedRow {
  id: string;
  side: Side;
}

export interface RowOffsets {
  /** Margin above each row, in order: negative pulls it up beside the post before it. */
  marginTops: number[];
  /** Space below the last row, so a taller post on the other side doesn't run into what's next. */
  paddingBottom: number;
}

/**
 * Where each post starts, given the heights measured so far (unknown ones count as 0). A post
 * on the same side as the one before goes a gap below it. A post on the other side starts a
 * gap past the middle of the one before, and two gaps below the last post on its own side, so
 * the post in between has room on both ends.
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
    // Rows are laid out one after the other, so the margin is measured from the row above.
    marginTops.push(i === 0 ? 0 : top - previousBottom);
    previousTop = top;
    previousBottom = top + height;
    sideBottom[row.side] = Math.max(sideBottom[row.side], previousBottom);
  });
  const lowest = Math.max(sideBottom.left, sideBottom.right, previousBottom);
  return { marginTops, paddingBottom: rows.length === 0 ? 0 : lowest - previousBottom };
}
