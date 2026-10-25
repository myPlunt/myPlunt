import type { Sitter } from '@/lib/user/types';

const NEARBY_KM = 25;

export interface SitterGroup {
  title: string;
  sitters: Sitter[];
}

// The backend already sorts same city first, then by distance, so each group keeps that order.
export function groupSitters(sitters: Sitter[]): SitterGroup[] {
  const isNearby = (s: Sitter) => !s.sameCity && s.distanceKm !== null && s.distanceKm <= NEARBY_KM;
  const sameCity = sitters.filter((s) => s.sameCity);
  return [
    { title: `In ${sameCity[0]?.city}`, sitters: sameCity },
    { title: 'Nearby', sitters: sitters.filter(isNearby) },
    { title: 'Other friends', sitters: sitters.filter((s) => !s.sameCity && !isNearby(s)) },
  ].filter((group) => group.sitters.length > 0);
}
