import * as gardenService from '@/features/garden/garden-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('getGarden', () => {
  it("fetches the signed-in user's garden from /v1/garden", async () => {
    const garden = { rooms: [{ id: 'r1', name: 'Balcony', plants: [] }] };
    mockedApiFetch.mockResolvedValue(garden);

    await expect(gardenService.getGarden()).resolves.toEqual(garden);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/garden');
  });
});

describe('waterPlant', () => {
  it('POSTs a watering for the plant to /v1/plants/:id/waterings', async () => {
    mockedApiFetch.mockResolvedValue(undefined);

    await gardenService.waterPlant('p1');

    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/plants/p1/waterings', { method: 'POST' });
  });
});
