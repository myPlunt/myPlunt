import { matchesSpecies } from '@/features/species/matches-species';
import type { Species } from '@/lib/species/types';

export interface PluntdexFilter {
  only: 'common' | 'discovered' | null;
  region: string | null;
}

export interface RegionProgress {
  name: string;
  discovered: number;
  total: number;
}

export function regionsOf(species: Species[], discovered: Set<string>): RegionProgress[] {
  const byName = new Map<string, RegionProgress>();
  for (const s of species) {
    if (!s.region) continue;
    const region = byName.get(s.region) ?? { name: s.region, discovered: 0, total: 0 };
    region.total++;
    if (discovered.has(s.id)) region.discovered++;
    byName.set(s.region, region);
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterSpecies(species: Species[], discovered: Set<string>, query: string, filter: PluntdexFilter) {
  return species.filter(
    (s) =>
      matchesSpecies(s, query) &&
      (filter.only !== 'common' || s.common) &&
      (filter.only !== 'discovered' || discovered.has(s.id)) &&
      (filter.region === null || s.region === filter.region),
  );
}
