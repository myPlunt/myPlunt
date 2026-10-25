import type { GardenPlant } from '@/lib/garden/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

/** Both days count: away Saturday until Sunday the week after is 9 days. */
export function tripDays(from: Date, until: Date): number {
  return daysBetween(from, until) + 1;
}

/** Due days of each plant's schedule that fall within the trip; an overdue plant is assumed watered before leaving. */
export function wateringsDuring(plants: GardenPlant[], from: Date, until: Date): number {
  return plants.reduce((total, plant) => {
    let due = daysBetween(from, new Date(plant.nextWateringAt));
    if (due < 0) due += Math.ceil(-due / plant.wateringFrequencyDays) * plant.wateringFrequencyDays;
    const last = daysBetween(from, until);
    return due > last ? total : total + Math.floor((last - due) / plant.wateringFrequencyDays) + 1;
  }, 0);
}

export function tripSummary(days: number, plantCount: number, waterings: number): string {
  const daysLabel = `${days} ${days === 1 ? 'day' : 'days'}`;
  if (plantCount === 0) return daysLabel;
  const plantsLabel = plantCount === 1 ? '1 plant needs' : `${plantCount} plants need`;
  return `${daysLabel} · ${plantsLabel} about ${waterings} ${waterings === 1 ? 'watering' : 'waterings'}`;
}

export function stayLabel(from: string, until: string): string {
  const format = (date: Date) => date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return `${format(new Date(from))} – ${format(addDays(new Date(until), -1))}`;
}
