import type { WateringLog } from '@/lib/plant/types';

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addMonths(month: Date, months: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + months, 1);
}

export function dayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Weeks of seven days, Monday first; days outside the month are null. */
export function calendarWeeks(month: Date): (Date | null)[][] {
  const first = startOfMonth(month);
  // getDay() is 0 for Sunday; shifted so Monday is 0 and Sunday 6.
  const leading = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const days: (Date | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1)),
  ];
  while (days.length % 7 !== 0) days.push(null);
  return Array.from({ length: days.length / 7 }, (_, week) => days.slice(week * 7, week * 7 + 7));
}

export function wateringsByDay(waterings: WateringLog[]): Map<string, WateringLog[]> {
  const byDay = new Map<string, WateringLog[]>();
  for (const watering of waterings) {
    const key = dayKey(new Date(watering.wateredAt));
    byDay.set(key, [...(byDay.get(key) ?? []), watering]);
  }
  return byDay;
}
