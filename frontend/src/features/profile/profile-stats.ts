import type { Garden } from '@/lib/garden/types';
import type { DiscoveredSpecies, Species } from '@/lib/species/types';

export interface ProfileStats {
  plants: number;
  /** Counted like the PluntDex's own "X / Y discovered": only species still in the list. */
  discovered: number;
  total: number;
  topStreak: number;
}

export function profileStats(garden: Garden, discovered: DiscoveredSpecies[], species: Species[]): ProfileStats {
  const plants = garden.rooms.flatMap((room) => room.plants);
  const discoveredIds = new Set(discovered.map((d) => d.speciesId));
  return {
    plants: plants.length,
    discovered: species.filter((s) => discoveredIds.has(s.id)).length,
    total: species.length,
    topStreak: Math.max(0, ...plants.map((plant) => plant.wateringStreak)),
  };
}
