/** Mirrors the backend's GardenResponse (GET /v1/garden). */
export interface Garden {
  rooms: Room[];
}

/** Mirrors RoomResponse. `id` is null for the group of plants that aren't in a room yet. */
export interface Room {
  id: string | null;
  name: string;
  plants: GardenPlant[];
}

/**
 * Mirrors GardenPlantResponse. speciesId and speciesName are null when the plant has no species, photoUrl
 * (a short-lived link) when it has no photo, lastWateredAt when it was never watered. Every
 * plant has a watering schedule, so wateringFrequencyDays and nextWateringAt are always set.
 */
export interface GardenPlant {
  id: string;
  name: string;
  speciesId: string | null;
  speciesName: string | null;
  wateringFrequencyDays: number;
  lastWateredAt: string | null;
  nextWateringAt: string;
  photoUrl: string | null;
}
