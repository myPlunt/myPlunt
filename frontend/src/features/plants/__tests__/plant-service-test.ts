import * as plantService from '@/features/plants/plant-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));
jest.mock('@/lib/time-zone', () => ({ timeZoneQuery: () => '?zone=Europe%2FAmsterdam' }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('createPlant', () => {
  it('POSTs the new plant to /v1/plants and returns the saved plant', async () => {
    const request = {
      name: 'Vera',
      light: 'bright_indirect' as const,
      wateringEveryDays: 7,
      notes: null,
      planterId: 'room-1',
      speciesId: 's1',
      photoKey: 'plants/u1/photo.jpg',
    };
    const { photoKey, ...fields } = request;
    const saved = { id: 'p1', ...fields, photoUrl: `https://storage.test/${photoKey}` };
    mockedApiFetch.mockResolvedValue(saved);

    await expect(plantService.createPlant(request)).resolves.toEqual(saved);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/plants', expect.objectContaining({ method: 'POST', body: request}));
<<<<<<< HEAD
=======
  });
});

describe('getPlant', () => {
  it('GETs the plant by id', async () => {
    const details = { id: 'p1', name: 'Vera' };
    mockedApiFetch.mockResolvedValue(details);

    await expect(plantService.getPlant('p1')).resolves.toEqual(details);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/plants/p1');
>>>>>>> origin/dev
  });
});

describe('updatePlant', () => {
  it('PUTs the changes to /v1/plants/{id} and returns the updated plant', async () => {
    const request = {
      name: 'Vera II',
      light: null,
      wateringEveryDays: null,
      notes: null,
      planterId: null,
      speciesId: null,
      photoKey: null,
    };
    const details = { id: 'p1', name: 'Vera II' };
    mockedApiFetch.mockResolvedValue(details);

    await expect(plantService.updatePlant('p1', request)).resolves.toEqual(details);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/plants/p1', expect.objectContaining({ method: 'PUT', body: request}));
  });
});

describe('deletePlant', () => {
  it('DELETEs /v1/plants/{id}', async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await expect(plantService.deletePlant('p1')).resolves.toBeUndefined();
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/plants/p1', expect.objectContaining({ method: 'DELETE' }));
<<<<<<< HEAD
=======
  });
});

describe('getWateringHistory', () => {
  it("GETs the plant's waterings, with the device's time zone for the streaks", async () => {
    const history = {
      plantName: 'Vera',
      wateringFrequencyDays: 7,
      currentStreak: 0,
      bestStreak: 0,
      onTimePercent: null,
      overdue: false,
      waterings: [],
    };
    mockedApiFetch.mockResolvedValue(history);

    await expect(plantService.getWateringHistory('p1')).resolves.toEqual(history);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/plants/p1/waterings?zone=Europe%2FAmsterdam');
>>>>>>> origin/dev
  });
});
