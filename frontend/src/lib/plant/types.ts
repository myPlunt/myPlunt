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
  /** Posts "new plant" to friends' feeds (GET /v1/posts/feed). Left out, it's false. */
  shareToFeed?: boolean;
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
export type UpdatePlantRequest = Omit<CreatePlantRequest, 'shareToFeed'>;

/** Mirrors WateringResponse: one logged watering. `daysLate` is 0 when it was on time. */
export interface Watering {
  id: string;
  wateredAt: string;
  daysLate: number;
}

/**
 * Mirrors WateringHistoryResponse (GET /v1/plants/{id}/waterings?zone=...). Waterings are
 * newest first. The backend works out on time, late and the streaks in the device's time
 * zone (see the backend's WateringConsistency). `currentStreak` is 0 once the plant is
 * `overdue`; `onTimePercent` is null before the first watering.
 */
export interface WateringHistory {
  plantName: string;
  wateringFrequencyDays: number;
  currentStreak: number;
  bestStreak: number;
  onTimePercent: number | null;
  overdue: boolean;
  waterings: Watering[];
}

/** Mirrors WateringLogResponse (GET /v1/waterings?from=...&to=...): one watering of one of the user's plants. */
export interface WateringLog {
  id: string;
  plantId: string;
  plantName: string;
  wateredAt: string;
}

/**
 * Mirrors WateringStreakResponse (GET /v1/waterings/streak?zone=...): the current streaks of
 * all the user's living plants added up, so it matches the numbers on the garden's plant cards.
 */
export interface WateringStreak {
  wateringStreak: number;
}

/**
 * Mirrors PlantPhotoResponse (GET /v1/plants/{id}/photos, oldest first): one photo in the
 * plant's growth timeline. `url` is a short-lived link; `takenAt` is null only for photos
 * from before the timeline existed.
 */
export interface PlantPhoto {
  id: string;
  url: string;
  takenAt: string | null;
  caption: string | null;
}

/** Mirrors UpdatePlantPhotoRequest (PUT /v1/plants/{id}/photos/{photoId}); a null `caption` removes the note. */
export interface UpdatePlantPhotoRequest {
  takenAt: string;
  caption: string | null;
}

/** Mirrors AddPlantPhotoRequest (POST /v1/plants/{id}/photos). A null `takenAt` means now. */
export interface AddPlantPhotoRequest {
  photoKey: string;
  takenAt: string | null;
  caption: string | null;
  /** Posts the photo to friends' feeds (GET /v1/posts/feed). Left out, it's false. */
  shareToFeed?: boolean;
}
