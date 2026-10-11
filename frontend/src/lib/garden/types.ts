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
<<<<<<< HEAD
 * Mirrors GardenPlantResponse. speciesId and speciesName are null when the plant has no species, photoUrl
=======
 * Mirrors GardenPlantResponse. speciesName is null when the plant has no species, photoUrl
>>>>>>> 33881a1 (FMP-007-Add plant edit logic inside each plant view.)
 * (a short-lived link) when it has no photo; the watering fields are null when it has no schedule.
 */
export interface GardenPlant {
  id: string;
  name: string;
  speciesId: string | null;
  speciesName: string | null;
  wateringFrequencyDays: number | null;
  lastWateredAt: string | null;
  nextWateringAt: string | null;
  photoUrl: string | null;
}
