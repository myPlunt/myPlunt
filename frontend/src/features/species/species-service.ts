import { apiFetch } from '@/lib/auth/api-client';
import type { DiscoveredSpecies, Species } from '@/lib/species/types';

/** Every approved species, sorted by common name. */
export async function getSpecies(): Promise<Species[]> {
  return apiFetch<Species[]>('/v1/species');
}

/** The species the user has ever owned a plant of, deleted plants included, and when. */
export async function getDiscoveredSpecies(): Promise<DiscoveredSpecies[]> {
  return apiFetch<DiscoveredSpecies[]>('/v1/species/discovered');
}
