/** Mirrors the backend's SpeciesResponse (GET /v1/species). */
export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  /** null when the species has no known watering schedule. */
  wateringFrequencyDays: number | null;
  /** Where the species comes from; null when unknown. */
  region: string | null;
  /** An everyday plant people own (basil, snake plant...), set by admins. */
  common: boolean;
  /** Short-lived link to the species' picture; null when it has none yet. */
  imageUrl: string | null;
}
