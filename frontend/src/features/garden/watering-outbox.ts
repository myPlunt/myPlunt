import { Alert } from 'react-native';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { GardenPlant } from '@/lib/garden/types';
import { logFailedUi } from '@/lib/logger';
import { readCache, writeCache } from '@/lib/offline/cache';
import type { WateringHistory } from '@/lib/plant/types';

import * as gardenService from './garden-service';

export interface QueuedWatering {
  plantId: string;
  plantName: string;
  wateredAt: string;
}

// A saved copy, so signing in or out clears it.
const KEY = 'queued-waterings';
const DAY_MS = 24 * 60 * 60 * 1000;

export async function queuedWaterings(): Promise<QueuedWatering[]> {
  return (await readCache<QueuedWatering[]>(KEY))?.data ?? [];
}

let changing: Promise<void> = Promise.resolve();

// One change at a time, so a watering queued while another is removed isn't lost.
function change(edit: (queued: QueuedWatering[]) => QueuedWatering[]): Promise<void> {
  changing = changing.then(async () => writeCache(KEY, edit(await queuedWaterings())));
  return changing;
}

export function queueWaterings(plants: Pick<GardenPlant, 'id' | 'name'>[]): Promise<void> {
  const wateredAt = new Date().toISOString();
  return change((queued) => [
    ...queued,
    ...plants.map((plant) => ({ plantId: plant.id, plantName: plant.name, wateredAt })),
  ]);
}

function same(a: QueuedWatering, b: QueuedWatering) {
  return a.plantId === b.plantId && a.wateredAt === b.wateredAt;
}

let sending: Promise<void> | null = null;

/** Never rejects. */
export function sendWaterings(): Promise<void> {
  sending ??= sendQueued().finally(() => {
    sending = null;
  });
  return sending;
}

async function sendQueued() {
  const tried: QueuedWatering[] = [];
  for (;;) {
    const watering = (await queuedWaterings()).find((queued) => !tried.some((done) => same(done, queued)));
    if (!watering) return;
    tried.push(watering);
    try {
      await gardenService.waterPlant(watering.plantId, watering.wateredAt);
    } catch (err) {
      if (!(err instanceof ApiError) || err.status === 0 || err.status === 401 || err.status >= 500) return;
      logFailedUi('watering_failed_ui', err, { plant_id: watering.plantId });
      Alert.alert('Watering not saved', `${watering.plantName}: ${describeError(err)}`);
    }
    await change((queued) => queued.filter((other) => !same(other, watering)));
  }
}

type WateredPlant = Pick<GardenPlant, 'id' | 'wateringFrequencyDays' | 'lastWateredAt' | 'nextWateringAt' | 'waitingToSync'>;

export function withQueuedWaterings<T extends WateredPlant>(plant: T, queued: QueuedWatering[]): T {
  const times = queued.filter((watering) => watering.plantId === plant.id).map((watering) => Date.parse(watering.wateredAt));
  if (times.length === 0) return plant;
  const latest = Math.max(...times);
  if (plant.lastWateredAt !== null && Date.parse(plant.lastWateredAt) >= latest) return { ...plant, waitingToSync: true };
  return {
    ...plant,
    lastWateredAt: new Date(latest).toISOString(),
    nextWateringAt: new Date(latest + plant.wateringFrequencyDays * DAY_MS).toISOString(),
    waitingToSync: true,
  };
}

export function withQueuedHistory(history: WateringHistory, plantId: string, queued: QueuedWatering[]): WateringHistory {
  const rows = queued
    .filter((watering) => watering.plantId === plantId)
    .map((watering) => ({ id: `queued-${watering.wateredAt}`, wateredAt: watering.wateredAt, daysLate: 0, waitingToSync: true }));
  if (rows.length === 0) return history;
  return {
    ...history,
    overdue: false,
    waterings: [...rows, ...history.waterings].sort((a, b) => Date.parse(b.wateredAt) - Date.parse(a.wateredAt)),
  };
}
