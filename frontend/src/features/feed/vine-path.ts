// Seeded, so the stem keeps its shape between renders.
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STRAIGHT_BASE = 70;
const STRAIGHT_TOP = 40;

export function vinePath(width: number, height: number, seed = 7) {
  const random = seededRandom(seed);
  const centre = width / 2;
  // Leaves room for the curve's overshoot between points and half the stroke width.
  const maxSway = centre - 10;
  // Straight for the first stretch, so it runs into the tab bar's + button head-on.
  const base = Math.min(STRAIGHT_BASE, height);
  const points = [
    { x: centre, y: height },
    { x: centre, y: height - base },
  ];
  // Straight at the top too, so the leaf always sits in the middle.
  const top = Math.min(STRAIGHT_TOP, height - base);
  for (let y = height - base - (40 + random() * 90); y > top; y -= 40 + random() * 90) {
    points.push({ x: centre + (random() * 2 - 1) * maxSway * (0.3 + random() * 0.7), y });
  }
  points.push({ x: centre, y: top }, { x: centre, y: 0 });

  // Catmull-Rom as cubic Béziers, one path per bend so each gets its own stroke width.
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    // How far up the stem the bend sits: 0 at the base, 1 at the tip.
    const progress = height > 0 ? 1 - (p1.y + p2.y) / 2 / height : 1;
    segments.push({ d: `M${p1.x} ${p1.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`, progress });
  }
  return { segments, tip: points[points.length - 1] };
}
