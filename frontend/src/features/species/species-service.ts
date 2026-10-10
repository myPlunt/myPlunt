import { apiFetch } from '@/lib/auth/api-client';
import type { Species } from '@/lib/species/types';

/** Every approved species, sorted by common name. */
export async function getSpecies(): Promise<Species[]> {
  return apiFetch<Species[]>('/v1/species');
}
