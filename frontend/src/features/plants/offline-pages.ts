import type { Garden } from '@/lib/garden/types';
import { cachedFetch, readCache, writeCache } from '@/lib/offline/cache';

import * as plantService from './plant-service';

export function cachedPlant(plantId: string) {
  return cachedFetch(`plant:${plantId}`, () => plantService.getPlant(plantId));
}

export function cachedPlantPhotos(plantId: string) {
  return cachedFetch(`photos:${plantId}`, () => plantService.getPlantPhotos(plantId));
}

export function cachedWateringHistory(plantId: string) {
  return cachedFetch(`waterings:${plantId}`, () => plantService.getWateringHistory(plantId));
}

// Several screens load the garden, so a run that's still going is shared, like api-client's refresh.
let running: Promise<void> | null = null;

/** One plant at a time, in the background, so any plant opens offline, not only the ones visited. */
export function savePlantPagesForOffline(garden: Garden): Promise<void> {
  if (!running) {
    running = saveChangedPages(garden).finally(() => {
      running = null;
    });
  }
  return running;
}

async function saveChangedPages(garden: Garden) {
  for (const room of garden.rooms) {
    for (const plant of room.plants) {
      // Pages are fetched again only when the plant's garden entry changes (the photo by its path, as
      // the link changes on every load), so a normal visit to the garden costs nothing.
      // ponytail: changes the garden doesn't show (notes, light, an older photo's caption) reach
      // the offline copy only when the plant is opened online; a bulk endpoint would cover them.
      const version = JSON.stringify([room.id, room.name, { ...plant, photoUrl: plant.photoUrl?.split('?')[0] }]);
      const versionKey = `plant-version:${plant.id}`;
      if ((await readCache<string>(versionKey))?.data === version) continue;

      const pages = await Promise.all([
        cachedPlant(plant.id),
        cachedPlantPhotos(plant.id),
        cachedWateringHistory(plant.id),
      ]);
      // Saved copies came back instead: the connection is gone, so the rest waits for the next garden.
      if (pages.some((page) => page.savedAt !== null)) return;
      await writeCache(versionKey, version);
    }
  }
}
