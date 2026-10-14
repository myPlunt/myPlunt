import { addMonths, calendarWeeks, dayKey, startOfMonth, wateringsByDay } from '@/features/profile/watering-calendar';

// Dates are built in local time, so the tests pass in any time zone.

describe('startOfMonth / addMonths', () => {
  it('goes to the first of the month and pages across years', () => {
    expect(startOfMonth(new Date(2026, 9, 13, 21, 30))).toEqual(new Date(2026, 9, 1));
    expect(addMonths(new Date(2026, 11, 1), 1)).toEqual(new Date(2027, 0, 1));
    expect(addMonths(new Date(2026, 0, 1), -1)).toEqual(new Date(2025, 11, 1));
  });
});

describe('dayKey', () => {
  it('names the calendar day with zero-padded month and day', () => {
    expect(dayKey(new Date(2026, 2, 7, 23, 59))).toBe('2026-03-07');
  });
});

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

  it('needs no padding before a month that starts on Monday', () => {
    // June 2026 starts on a Monday.
    expect(calendarWeeks(new Date(2026, 5, 1))[0][0]).toEqual(new Date(2026, 5, 1));
  });

  it('puts a Sunday the 1st at the end of the first week', () => {
    // February 2026 starts on a Sunday.
    const weeks = calendarWeeks(new Date(2026, 1, 1));

    expect(weeks[0][6]).toEqual(new Date(2026, 1, 1));
    expect(weeks).toHaveLength(5);
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
