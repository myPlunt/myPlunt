import type { GardenPlant } from '@/lib/garden/types';

import { tripDays, tripSummary, wateringsDuring } from '../away-trip';

function plant(nextWateringAt: Date, wateringFrequencyDays: number): GardenPlant {
  return {
    id: String(Math.random()),
    name: 'Monstera',
    speciesId: null,
    speciesName: null,
    wateringFrequencyDays,
    lastWateredAt: null,
    nextWateringAt: nextWateringAt.toISOString(),
    wateringStreak: 0,
    photoUrl: null,
  };
}

describe('away trip', () => {
  const from = new Date(2026, 10, 7);
  const until = new Date(2026, 10, 15);

  it('counts both the first and the last day of the trip', () => {
    expect(tripDays(from, until)).toBe(9);
  });

  it('counts the waterings each plant needs while you are away', () => {
    const plants = [
      plant(new Date(2026, 10, 7, 18), 3), // 7, 10, 13 Nov
      plant(new Date(2026, 10, 5), 4), // overdue: 9, 13 Nov
      plant(new Date(2026, 10, 20), 7), // after the trip
    ];

    expect(wateringsDuring(plants, from, until)).toBe(5);
    expect(tripSummary(9, plants.length, 5)).toBe('9 days · 3 plants need about 5 waterings');
  });
});
