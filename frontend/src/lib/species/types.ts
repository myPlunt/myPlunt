/** Mirrors the backend's SpeciesResponse (GET /v1/species). */
export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  /** null when the species has no known watering schedule. */
  wateringFrequencyDays: number | null;
  /** Where the species comes from; null when unknown. */
  region: string | null;
  /** Free text, e.g. "Low to bright indirect"; null when unknown. */
  sunlightNeeds: string | null;
  /** An everyday plant people own (basil, snake plant...), set by admins. */
  common: boolean;
  /** Short-lived link to the species' picture; null when it has none yet. */
  imageUrl: string | null;
}

/** Mirrors DiscoveredSpeciesResponse (GET /v1/species/discovered): a species the user has discovered, and when. */
export interface DiscoveredSpecies {
  speciesId: string;
  /** ISO timestamp of the first time the user owned a plant of it. */
  discoveredAt: string;
}
