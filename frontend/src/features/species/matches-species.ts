import type { Species } from '@/lib/species/types';

export function matchesSpecies(species: Species, query: string) {
  const needle = query.trim().toLowerCase();
  return species.commonName.toLowerCase().includes(needle) || species.scientificName.toLowerCase().includes(needle);
}
