import type { Species } from '@/lib/species/types';

/** Whether the species' common or scientific name contains the query (case-insensitive). */
export function matchesSpecies(species: Species, query: string) {
  const needle = query.trim().toLowerCase();
  return species.commonName.toLowerCase().includes(needle) || species.scientificName.toLowerCase().includes(needle);
}
