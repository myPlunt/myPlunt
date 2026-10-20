import type { GardenPlant } from '@/lib/garden/types';
import type { Species } from '@/lib/species/types';

import { profileStats } from '../profile-stats';

function plant(id: string, wateringStreak: number): GardenPlant {
  return {
    id,
    name: id,
    speciesId: null,
    speciesName: null,
    wateringFrequencyDays: 7,
    lastWateredAt: null,
    nextWateringAt: '2026-10-25T09:00:00Z',
    wateringStreak,
    photoUrl: null,
  };
}

function species(id: string): Species {
  return {
    id,
    commonName: id,
    scientificName: id,
    wateringFrequencyDays: null,
    region: null,
    sunlightNeeds: null,
    common: false,
    imageUrl: null,
  };
}

it('counts plants across rooms, discoveries still in the list, and the top streak', () => {
  const garden = {
    rooms: [
      { id: 'r1', name: 'Balcony', plants: [plant('a', 3), plant('b', 9)] },
      { id: null, name: 'Other plants', plants: [plant('c', 0)] },
    ],
  };
  // "gone" was discovered but is no longer an approved species, so it isn't counted (like the PluntDex).
  const discovered = ['basil', 'gone'].map((speciesId) => ({ speciesId, discoveredAt: '2026-10-01T10:00:00Z' }));

  expect(profileStats(garden, discovered, [species('basil'), species('fern')])).toEqual({
    plants: 3,
    discovered: 1,
    total: 2,
    topStreak: 9,
  });
});

it('is all zeros for an empty garden and PluntDex', () => {
  expect(profileStats({ rooms: [] }, [], [])).toEqual({ plants: 0, discovered: 0, total: 0, topStreak: 0 });
});
