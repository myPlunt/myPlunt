export interface Species {
  id: string;
  commonName: string;
  scientificName: string;
  wateringFrequencyDays: number | null;
  region: string | null;
  sunlightNeeds: string | null;
  common: boolean;
  imageUrl: string | null;
}

export interface DiscoveredSpecies {
  speciesId: string;
  discoveredAt: string;
}
