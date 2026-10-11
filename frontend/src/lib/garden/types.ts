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
<<<<<<< HEAD
>>>>>>> 33881a1 (FMP-007-Add plant edit logic inside each plant view.)
 * (a short-lived link) when it has no photo; the watering fields are null when it has no schedule.
=======
 * (a short-lived link) when it has no photo, lastWateredAt when it was never watered. Every
 * plant has a watering schedule, so wateringFrequencyDays and nextWateringAt are always set.
>>>>>>> 9fa7e8e (FMP-008-Added proper water schedule forr each plant.)
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
