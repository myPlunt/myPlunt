import { matchesSpecies } from '@/features/species/matches-species';
import type { Species } from '@/lib/species/types';

/** The Pluntdex filters: a Common/Caught chip and a region, each null when not picked. */
export interface PluntdexFilter {
  only: 'common' | 'caught' | null;
  region: string | null;
}

/** The regions species come from, A to Z, for the region dropdown. */
export function regionsOf(species: Species[]): string[] {
  return [...new Set(species.flatMap((s) => (s.region ? [s.region] : [])))].sort();
}

/** The species that match the search and every picked filter, in their original order. */
export function filterSpecies(species: Species[], caught: Set<string>, query: string, filter: PluntdexFilter) {
  return species.filter(
    (s) =>
      matchesSpecies(s, query) &&
      (filter.only !== 'common' || s.common) &&
      (filter.only !== 'caught' || caught.has(s.id)) &&
      (filter.region === null || s.region === filter.region),
  );
}
