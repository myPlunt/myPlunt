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
 * Mirrors GardenPlantResponse. speciesName is null when the plant has no species; the
 * watering fields are null when it has no schedule.
 */
export interface GardenPlant {
  id: string;
  name: string;
  speciesName: string | null;
  wateringFrequencyDays: number | null;
  lastWateredAt: string | null;
  nextWateringAt: string | null;
}
