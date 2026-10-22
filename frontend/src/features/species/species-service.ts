import { apiFetch } from '@/lib/auth/api-client';
import type { DiscoveredSpecies, Species } from '@/lib/species/types';

export async function getSpecies(): Promise<Species[]> {
  return apiFetch<Species[]>('/v1/species');
}

export async function getDiscoveredSpecies(userId?: string): Promise<DiscoveredSpecies[]> {
  return apiFetch<DiscoveredSpecies[]>(userId ? `/v1/users/${userId}/species/discovered` : '/v1/species/discovered');
}
