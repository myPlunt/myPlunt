import { apiFetch } from '@/lib/auth/api-client';
import type { Species } from '@/lib/species/types';

/** Every approved species, sorted by common name. */
export async function getSpecies(): Promise<Species[]> {
  return apiFetch<Species[]>('/v1/species');
}

/** Ids of the species the user has ever owned a plant of, deleted plants included. */
export async function getCaughtSpeciesIds(): Promise<string[]> {
  return apiFetch<string[]>('/v1/species/caught');
}
