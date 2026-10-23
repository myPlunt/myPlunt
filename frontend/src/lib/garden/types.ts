export interface Garden {
  rooms: Room[];
}

/** `id` is null for the group of plants that aren't in a room yet. */
export interface Room {
  id: string | null;
  name: string;
  plants: GardenPlant[];
}

export interface GardenPlant {
  id: string;
  name: string;
  speciesId: string | null;
  speciesName: string | null;
  wateringFrequencyDays: number;
  lastWateredAt: string | null;
  nextWateringAt: string;
  wateringStreak: number;
  photoUrl: string | null;
  waitingToSync?: boolean;
}
