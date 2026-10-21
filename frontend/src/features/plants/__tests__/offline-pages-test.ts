import { savePlantPagesForOffline } from '@/features/plants/offline-pages';
import * as plantService from '@/features/plants/plant-service';
import { ApiError } from '@/lib/auth/api-client';
import type { Garden, GardenPlant } from '@/lib/garden/types';

jest.mock('@/features/plants/plant-service');

const mockedPlantService = jest.mocked(plantService);

function plant(id: string, lastWateredAt: string | null = null): GardenPlant {
  return {
    id,
    name: id,
    speciesId: null,
    speciesName: null,
    wateringFrequencyDays: 4,
    lastWateredAt,
    nextWateringAt: '2026-10-25T12:00:00.000Z',
    wateringStreak: 0,
    photoUrl: `https://storage.test/plants/${id}.jpg?X-Amz-Signature=first`,
  };
}

function gardenOf(...plants: GardenPlant[]): Garden {
  return { rooms: [{ id: 'balcony', name: 'Balcony', plants }] };
}

beforeEach(() => {
  mockedPlantService.getPlant.mockResolvedValue({} as Awaited<ReturnType<typeof plantService.getPlant>>);
  mockedPlantService.getPlantPhotos.mockResolvedValue([]);
  mockedPlantService.getWateringHistory.mockResolvedValue(
    {} as Awaited<ReturnType<typeof plantService.getWateringHistory>>,
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

it("saves every plant's details, photos and watering history the first time", async () => {
  await savePlantPagesForOffline(gardenOf(plant('basil'), plant('minty')));

  expect(mockedPlantService.getPlant.mock.calls).toEqual([['basil'], ['minty']]);
  expect(mockedPlantService.getPlantPhotos.mock.calls).toEqual([['basil'], ['minty']]);
  expect(mockedPlantService.getWateringHistory.mock.calls).toEqual([['basil'], ['minty']]);
});

it('fetches a plant again only once it changed in the garden', async () => {
  await savePlantPagesForOffline(gardenOf(plant('basil'), plant('minty')));
  jest.clearAllMocks();

  // A new link to the same photo is no change; a watering is.
  const relinked = { ...plant('basil'), photoUrl: 'https://storage.test/plants/basil.jpg?X-Amz-Signature=second' };
  await savePlantPagesForOffline(gardenOf(relinked, plant('minty', '2026-10-21T08:00:00.000Z')));

  expect(mockedPlantService.getPlant.mock.calls).toEqual([['minty']]);
});

it('fetches a changed plant again when the connection went and only its saved pages came back', async () => {
  await savePlantPagesForOffline(gardenOf(plant('basil')));
  const offline = new ApiError(0, 'Network request failed');
  mockedPlantService.getPlant.mockRejectedValueOnce(offline);
  mockedPlantService.getPlantPhotos.mockRejectedValueOnce(offline);
  mockedPlantService.getWateringHistory.mockRejectedValueOnce(offline);
  const watered = plant('basil', '2026-10-21T08:00:00.000Z');
  await savePlantPagesForOffline(gardenOf(watered));

  await savePlantPagesForOffline(gardenOf(watered));

  expect(mockedPlantService.getPlant).toHaveBeenCalledTimes(3);
});
