export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  wateringFrequencyDays: number | null;
  // Every region the plant is native to; empty when unknown.
  regions: string[];
  sunlightNeeds: string | null;
  common: boolean;
  imageUrl: string | null;
}

export interface DiscoveredSpecies {
  speciesId: string;
  discoveredAt: string;
}
