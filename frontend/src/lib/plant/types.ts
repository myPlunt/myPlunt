/** Same values as CreatePlantRequest's pattern and the chk_plants_light constraint. */
export type Light = 'full_sun' | 'bright_indirect' | 'partial_shade' | 'low_light';

/** Mirrors the backend's PlantResponse (POST /v1/plants). */
export interface Plant {
  id: string;
  name: string;
  light: Light | null;
  wateringEveryDays: number | null;
  notes: string | null;
}

/** Mirrors CreatePlantRequest (POST /v1/plants). */
export interface CreatePlantRequest {
  name: string;
  light: Light | null;
  wateringEveryDays: number | null;
  notes: string | null;
}
