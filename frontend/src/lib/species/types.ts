/** Mirrors the backend's SpeciesResponse (GET /v1/species). */
export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  /** null when the species has no known watering schedule. */
  wateringFrequencyDays: number | null;
}
