import { apiFetch } from '@/lib/auth/api-client';
import type { DiscoveredSpecies, Species } from '@/lib/species/types';

/** Every approved species, sorted by common name. */
export async function getSpecies(): Promise<Species[]> {
  return apiFetch<Species[]>('/v1/species');
}

/**
 * The species the user has ever owned a plant of, deleted plants included, and when. With userId,
 * a friend's (the backend turns away anyone else).
 */
export async function getDiscoveredSpecies(userId?: string): Promise<DiscoveredSpecies[]> {
  return apiFetch<DiscoveredSpecies[]>(userId ? `/v1/users/${userId}/species/discovered` : '/v1/species/discovered');
}
