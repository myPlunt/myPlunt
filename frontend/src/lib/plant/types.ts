/** Same values as CreatePlantRequest's pattern and the chk_plants_light constraint. */
export type Light = 'full_sun' | 'bright_indirect' | 'partial_shade' | 'low_light';

export interface Plant {
  id: string;
  name: string;
  light: Light | null;
  wateringEveryDays: number | null;
  notes: string | null;
  planterId: string | null;
  speciesId: string | null;
  photoUrl: string | null;
}

export interface CreatePlantRequest {
  name: string;
  light: Light | null;
  wateringEveryDays: number | null;
  notes: string | null;
  planterId: string | null;
  speciesId: string | null;
  photoKey: string | null;
  shareToFeed?: boolean;
}

/** wateringEveryDays is the owner's own setting; wateringFrequencyDays is the one in use (the species', then 7 days). */
export interface PlantDetails extends Plant {
  planterName: string | null;
  speciesName: string | null;
  wateringFrequencyDays: number;
  lastWateredAt: string | null;
  nextWateringAt: string;
  /** Set by the app, never the server: watered offline and not sent yet. */
  waitingToSync?: boolean;
}

/** null clears a field, except photoKey, where null keeps the current photo. */
export type UpdatePlantRequest = Omit<CreatePlantRequest, 'shareToFeed'>;

export interface Watering {
  id: string;
  wateredAt: string;
  daysLate: number;
  /** Set by the app, never the server: watered offline and not sent yet. */
  waitingToSync?: boolean;
}

export interface WateringHistory {
  plantName: string;
  wateringFrequencyDays: number;
  currentStreak: number;
  bestStreak: number;
  onTimePercent: number | null;
  overdue: boolean;
  waterings: Watering[];
}

export interface WateringLog {
  id: string;
  plantId: string;
  plantName: string;
  wateredAt: string;
}

export interface WateringStreak {
  wateringStreak: number;
}

export interface PlantPhoto {
  id: string;
  url: string;
  takenAt: string | null;
  caption: string | null;
}

export interface UpdatePlantPhotoRequest {
  takenAt: string;
  caption: string | null;
}

/** A null takenAt means now. */
export interface AddPlantPhotoRequest {
  photoKey: string;
  takenAt: string | null;
  comment: string | null;
  shareToFeed?: boolean;
}
