export type Side = 'left' | 'right';

const MAX_IN_A_ROW = 2;

// A small string hash, so a post keeps its side (and its note colour) between loads.
export function hash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h, 31) + id.charCodeAt(i)) | 0;
  }
  return h;
}

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
