/** Same values as CreatePlantRequest's pattern and the chk_plants_light constraint. */
export type Light = 'full_sun' | 'bright_indirect' | 'partial_shade' | 'low_light';

/** Mirrors the backend's PlantResponse (POST /v1/plants). */
export interface Plant {
  id: string;
  name: string;
  light: Light | null;
  wateringEveryDays: number | null;
  notes: string | null;
  planterId: string | null;
  speciesId: string | null;
  /** Short-lived link to the plant's photo; null when it has none. */
  photoUrl: string | null;
}

/** Mirrors CreatePlantRequest (POST /v1/plants). */
export interface CreatePlantRequest {
  name: string;
  light: Light | null;
  wateringEveryDays: number | null;
  notes: string | null;
  /** One of the user's planters (a room in the garden); null leaves it under "Other plants". */
  planterId: string | null;
  /** An approved species from GET /v1/species; null when none was picked. */
  speciesId: string | null;
  /** Key from uploading a photo (features/photos); null for no photo. */
  photoKey: string | null;
}

/**
 * Mirrors PlantDetailsResponse (GET and PUT /v1/plants/{id}). `wateringEveryDays` is the
 * owner's own setting; `wateringFrequencyDays` is the one in use (it falls back to the
 * species', then to 7 days), so every plant has a schedule. The names, last watering and
 * photo are null when there's none.
 */
export interface PlantDetails extends Plant {
  planterName: string | null;
  speciesName: string | null;
  wateringFrequencyDays: number;
  lastWateredAt: string | null;
  nextWateringAt: string;
}

/**
 * Mirrors UpdatePlantRequest (PUT /v1/plants/{id}): the same fields as a new plant, and
 * null clears a field, except `photoKey`, where null keeps the current photo.
 */
export type UpdatePlantRequest = CreatePlantRequest;
