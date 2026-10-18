import { timeBetween } from '@/features/plants/growth';

describe('timeBetween', () => {
  it('counts whole calendar months once it is a month or more', () => {
    expect(timeBetween('2026-01-12T12:00:00', '2026-06-14T12:00:00')).toBe('5 months');
    expect(timeBetween('2026-06-14T12:00:00', '2026-08-20T12:00:00', true)).toBe('2 mo');
    // 20 Jan to 5 Mar is one full month, not two.
    expect(timeBetween('2026-01-20T12:00:00', '2026-03-05T12:00:00')).toBe('1 month');
  });

  it('counts days under a month', () => {
    expect(timeBetween('2026-01-20T12:00:00', '2026-02-05T12:00:00')).toBe('16 days');
    expect(timeBetween('2026-02-05T08:00:00', '2026-02-05T20:00:00')).toBe('Same day');
  });
});
