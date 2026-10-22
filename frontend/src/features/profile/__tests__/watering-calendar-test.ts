import { calendarWeeks, wateringsByDay } from '@/features/profile/watering-calendar';

describe('calendarWeeks', () => {
  it('starts the weeks on Monday and pads the month with empty days', () => {
    // October 2026 starts on a Thursday and ends on a Saturday.
    const weeks = calendarWeeks(new Date(2026, 9, 1));

    expect(weeks).toHaveLength(5);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0][3]).toEqual(new Date(2026, 9, 1));
    expect(weeks[4][5]).toEqual(new Date(2026, 9, 31));
    expect(weeks[4][6]).toBeNull();
  });
});

describe('wateringsByDay', () => {
  it('groups the waterings by local calendar day, keeping their order', () => {
    const watering = (id: string, date: Date) => ({ id, plantId: 'p1', plantName: 'Vera', wateredAt: date.toISOString() });
    const late = watering('w1', new Date(2026, 9, 7, 23, 30));
    const early = watering('w2', new Date(2026, 9, 7, 0, 15));
    const other = watering('w3', new Date(2026, 9, 5, 9, 0));

    const byDay = wateringsByDay([late, early, other]);

    expect(byDay.get('2026-10-07')).toEqual([late, early]);
    expect(byDay.get('2026-10-05')).toEqual([other]);
    expect(byDay.size).toBe(2);
  });
});
