import { Alert } from 'react-native';

import * as gardenService from '@/features/garden/garden-service';
import {
  queuedWaterings,
  queueWaterings,
  sendWaterings,
  withQueuedHistory,
  withQueuedWaterings,
  type QueuedWatering,
} from '@/features/garden/watering-outbox';
import { ApiError } from '@/lib/auth/api-client';
import type { GardenPlant } from '@/lib/garden/types';
import type { WateringHistory } from '@/lib/plant/types';

jest.mock('@/features/garden/garden-service');

const waterPlant = jest.mocked(gardenService.waterPlant);
const basil = { id: 'basil', name: 'Basil' };
const minty = { id: 'minty', name: 'Minty' };

beforeEach(() => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.resetAllMocks();
});

async function queuedPlantIds() {
  return (await queuedWaterings()).map((watering) => watering.plantId);
}

describe('sendWaterings', () => {
  it('sends a queued watering with the time it was made, then forgets it', async () => {
    await queueWaterings([basil]);
    const [{ wateredAt }] = await queuedWaterings();

    await sendWaterings();

    expect(waterPlant).toHaveBeenCalledWith('basil', wateredAt);
    expect(await queuedPlantIds()).toEqual([]);
  });

  it('keeps them for the next try without a connection or on a server error', async () => {
    await queueWaterings([basil, minty]);

    waterPlant.mockRejectedValueOnce(new ApiError(0, 'Network request failed'));
    await sendWaterings();
    expect(waterPlant).toHaveBeenCalledTimes(1);
    expect(await queuedPlantIds()).toEqual(['basil', 'minty']);

    waterPlant.mockRejectedValueOnce(new ApiError(503, 'Service unavailable'));
    await sendWaterings();
    expect(await queuedPlantIds()).toEqual(['basil', 'minty']);
  });

  it('drops a watering the server turns down for good, and says so', async () => {
    await queueWaterings([basil, minty]);
    waterPlant.mockRejectedValueOnce(new ApiError(404, 'Plant not found', { detail: 'Plant not found' }));

    await sendWaterings();

    expect(Alert.alert).toHaveBeenCalledWith('Watering not saved', 'Basil: Plant not found');
    expect(waterPlant).toHaveBeenLastCalledWith('minty', expect.any(String));
    expect(await queuedPlantIds()).toEqual([]);
  });

  it('also sends a watering queued while sending', async () => {
    await queueWaterings([basil]);
    waterPlant.mockImplementationOnce(() => queueWaterings([minty]));

    await sendWaterings();

    expect(waterPlant.mock.calls.map(([plantId]) => plantId)).toEqual(['basil', 'minty']);
    expect(await queuedPlantIds()).toEqual([]);
  });

  it('shares one send between screens that load at the same time', async () => {
    await queueWaterings([basil]);

    await Promise.all([sendWaterings(), sendWaterings()]);

    expect(waterPlant).toHaveBeenCalledTimes(1);
  });
});

function queued(wateredAt: string, plantId = 'basil'): QueuedWatering {
  return { plantId, plantName: 'Basil', wateredAt };
}

describe('withQueuedWaterings', () => {
  const plant: GardenPlant = {
    id: 'basil',
    name: 'Basil',
    speciesId: null,
    speciesName: null,
    wateringFrequencyDays: 3,
    lastWateredAt: '2026-10-01T08:00:00.000Z',
    nextWateringAt: '2026-10-04T08:00:00.000Z',
    wateringStreak: 2,
    photoUrl: null,
  };

  it('leaves a plant with nothing queued as it is', () => {
    expect(withQueuedWaterings(plant, [queued('2026-10-05T08:00:00.000Z', 'minty')])).toBe(plant);
  });

  it('shows the newest queued watering, waiting to sync', () => {
    expect(withQueuedWaterings(plant, [queued('2026-10-05T08:00:00.000Z'), queued('2026-10-06T09:30:00.000Z')])).toEqual({
      ...plant,
      lastWateredAt: '2026-10-06T09:30:00.000Z',
      nextWateringAt: '2026-10-09T09:30:00.000Z',
      waitingToSync: true,
    });
  });

  it('keeps a newer watering the server already has', () => {
    expect(withQueuedWaterings(plant, [queued('2026-09-30T08:00:00.000Z')])).toEqual({ ...plant, waitingToSync: true });
  });
});

describe('withQueuedHistory', () => {
  const history: WateringHistory = {
    plantName: 'Basil',
    wateringFrequencyDays: 3,
    currentStreak: 0,
    bestStreak: 2,
    onTimePercent: 50,
    overdue: true,
    waterings: [{ id: 'w1', wateredAt: '2026-10-01T08:00:00.000Z', daysLate: 2 }],
  };

  it('lists the queued waterings first, waiting to sync, and the plant is no longer overdue', () => {
    expect(withQueuedHistory(history, 'basil', [queued('2026-10-06T09:30:00.000Z')])).toEqual({
      ...history,
      overdue: false,
      waterings: [
        { id: 'queued-2026-10-06T09:30:00.000Z', wateredAt: '2026-10-06T09:30:00.000Z', daysLate: 0, waitingToSync: true },
        history.waterings[0],
      ],
    });
  });

  it("leaves another plant's history as it is", () => {
    expect(withQueuedHistory(history, 'minty', [queued('2026-10-06T09:30:00.000Z')])).toBe(history);
  });
});
