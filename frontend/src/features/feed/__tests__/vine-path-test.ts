import { vinePath } from '@/features/feed/vine-path';

function points(d: string) {
  // Every "x y" pair in the path, in order.
  const numbers = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  return Array.from({ length: numbers.length / 2 }, (_, i) => ({ x: numbers[i * 2], y: numbers[i * 2 + 1] }));
}

describe('vinePath', () => {
  it('climbs from the bottom centre to the top centre and stays inside its box', () => {
    const { segments, tip } = vinePath(56, 600);
    const all = points(segments.map((segment) => segment.d).join(' '));

    expect(all[0]).toEqual({ x: 28, y: 600 });
    expect(all[all.length - 1]).toEqual(tip);
    expect(tip).toEqual({ x: 28, y: 0 });
    for (const { x } of all) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(56);
    }
  });

  it('keeps the same shape for the same seed, so it does not jump between renders', () => {
    expect(vinePath(56, 600)).toEqual(vinePath(56, 600));
    expect(vinePath(56, 600, 1)).not.toEqual(vinePath(56, 600, 2));
  });
});
