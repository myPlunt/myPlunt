import type { Garden, GardenPlant, Room } from '@/lib/garden/types';

export type WateringTone = 'none' | 'normal' | 'soon' | 'overdue';

export interface WateringStatus {
  /** Short, for the status pill on a plant card: "In 5 days", "Tomorrow", "Overdue". */
  label: string;
  tone: WateringTone;
  /** How much water the plant has left, from 0 (needs water) to 1 (just watered). Used for sorting. */
  level: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const TOMORROW_LEVEL = 0.1;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/**
 * Calendar days from today until the plant is due, in the device's time zone, so
 * "Today" flips at the user's own midnight. Negative when overdue.
 */
export function daysUntilWatering(plant: GardenPlant, now: Date): number | null {
  if (!plant.nextWateringAt) return null;
  // Rounded because a day across a daylight-saving change is 23 or 25 hours long.
  return Math.round((startOfDay(new Date(plant.nextWateringAt)) - startOfDay(now)) / DAY_MS);
}

export function wateringStatus(plant: GardenPlant, now: Date): WateringStatus {
  const days = daysUntilWatering(plant, now);
  if (days === null || !plant.wateringFrequencyDays) {
    return { label: 'No schedule', tone: 'none', level: 0 };
  }

  // A plant due tomorrow shows just a thin layer of water, so it reads as "nearly
  // dry" whatever its watering frequency; later days scale with the time left.
  const level = days <= 0 ? 0 : days === 1 ? TOMORROW_LEVEL : Math.min(days / plant.wateringFrequencyDays, 1);
  if (days < 0) return { label: 'Overdue', tone: 'overdue', level };
  if (days === 0) return { label: 'Today', tone: 'soon', level };
  if (days === 1) return { label: 'Tomorrow', tone: 'soon', level };
  return { label: `In ${days} days`, tone: 'normal', level };
}

/**
 * Least water first. Equal levels (an overdue and a
 * due-today plant are both empty) go by which is due first; plants without a
 * schedule go last.
 */
export function sortByWaterLevel(plants: GardenPlant[], now: Date): GardenPlant[] {
  const rank = (plant: GardenPlant) => {
    const days = daysUntilWatering(plant, now);
    return { unscheduled: days === null, level: wateringStatus(plant, now).level, days: days ?? 0 };
  };
  return plants
    .map((plant) => ({ plant, ...rank(plant) }))
    .sort((a, b) => Number(a.unscheduled) - Number(b.unscheduled) || a.level - b.level || a.days - b.days)
    .map(({ plant }) => plant);
}

/** Plants due today or overdue, in garden order. */
export function plantsNeedingWater(garden: Garden, now: Date): GardenPlant[] {
  return garden.rooms
    .flatMap((room) => room.plants)
    .filter((plant) => {
      const days = daysUntilWatering(plant, now);
      return days !== null && days <= 0;
    });
}

function plural(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

/** "6 plants in 3 rooms". Plants without a room count as plants but not as a room. */
export function gardenSummary(garden: Garden): string {
  const plantCount = garden.rooms.reduce((sum, room) => sum + room.plants.length, 0);
  const roomCount = garden.rooms.filter((room) => room.id !== null).length;
  const plants = plural(plantCount, 'plant');
  return roomCount === 0 ? plants : `${plants} in ${plural(roomCount, 'room')}`;
}

/** "3 plants · 1 needs water", or just "3 plants" when none are due. */
export function roomSummary(room: Room, now: Date): string {
  const plants = plural(room.plants.length, 'plant');
  const due = plantsNeedingWater({ rooms: [room] }, now).length;
  return due === 0 ? plants : `${plants} · ${due} ${due === 1 ? 'needs' : 'need'} water`;
}

/** "Pinky", "Pinky and Basil", "Pinky, Basil and Minty", "Pinky, Basil and 2 more". */
export function listPlantNames(plants: GardenPlant[]): string {
  const names = plants.map((plant) => plant.name);
  if (names.length <= 1) return names.join('');
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`;
}
