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
