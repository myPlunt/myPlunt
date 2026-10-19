export type Side = 'left' | 'right';

// Most cards in a row on one side of the stem before the next has to switch.
const MAX_IN_A_ROW = 2;

// A small string hash, so a post keeps its side (and its note colour) between loads.
export function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  }
  return h;
}

/**
 * Which side of the stem each post hangs on, in the order given: picked at random per post,
 * but never more than two in a row on the same side.
 */
export function feedSides(postIds: string[]): Side[] {
  const sides: Side[] = [];
  for (const id of postIds) {
    const last = sides.slice(-MAX_IN_A_ROW);
    const full = last.length === MAX_IN_A_ROW && last.every((side) => side === last[0]);
    const random: Side = (hash(id) & 1) === 0 ? 'left' : 'right';
    sides.push(full ? (last[0] === 'left' ? 'right' : 'left') : random);
  }
  return sides;
}
