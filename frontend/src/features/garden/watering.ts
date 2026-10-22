import type { Garden, GardenPlant, Room } from '@/lib/garden/types';

/** How urgent watering is: 3+ days, 2 days, tomorrow, today or overdue. */
export type WateringTone = 'later' | 'soon' | 'tomorrow' | 'due';

export interface WateringStatus {
  label: string;
  tone: WateringTone;
}

type WateringSchedule = Pick<GardenPlant, 'nextWateringAt' | 'lastWateredAt'>;

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** Calendar days until it's due, in the device's time zone; negative when overdue. */
export function daysUntilWatering(plant: WateringSchedule, now: Date): number {
  // Rounded because a day across a daylight-saving change is 23 or 25 hours long.
  return Math.round((startOfDay(new Date(plant.nextWateringAt)) - startOfDay(now)) / DAY_MS);
}

export function wateringStatus(plant: WateringSchedule, now: Date): WateringStatus {
  const days = daysUntilWatering(plant, now);
  // Watered today stays calm, even on a 1- or 2-day schedule that would restart at an urgent "Tomorrow".
  const wateredToday = plant.lastWateredAt !== null && lastWateredLabel(plant.lastWateredAt, now) === 'Today';
  if (days < 0) return { label: 'Overdue', tone: 'due' };
  if (days === 0) return { label: 'Today', tone: 'due' };
  if (days === 1) return { label: 'Tomorrow', tone: wateredToday ? 'later' : 'tomorrow' };
  if (days === 2) return { label: 'In 2 days', tone: wateredToday ? 'later' : 'soon' };
  return { label: `In ${days} days`, tone: 'later' };
}

/** Soonest due first; ties go by name, so the order never changes on reload. */
export function sortByNextWatering(plants: GardenPlant[], now: Date): GardenPlant[] {
  const days = (plant: GardenPlant) => daysUntilWatering(plant, now);
  return [...plants].sort((a, b) => days(a) - days(b) || a.name.localeCompare(b.name));
}

export function plantsNeedingWater(garden: Garden, now: Date): GardenPlant[] {
  return garden.rooms
    .flatMap((room) => room.plants)
    .filter((plant) => daysUntilWatering(plant, now) <= 0);
}

export function lastWateredLabel(lastWateredAt: string | null, now: Date): string {
  if (!lastWateredAt) return 'Not yet';
  const days = Math.round((startOfDay(now) - startOfDay(new Date(lastWateredAt))) / DAY_MS);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

export function roomSummary(room: Room, now: Date): string {
  const plants = plural(room.plants.length, 'plant');
  const due = plantsNeedingWater({ rooms: [room] }, now).length;
  return due === 0 ? plants : `${plants} · ${due} ${due === 1 ? 'needs' : 'need'} water`;
}

export function listPlantNames(plants: GardenPlant[]): string {
  const names = plants.map((plant) => plant.name);
  if (names.length <= 1) return names.join('');
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}
