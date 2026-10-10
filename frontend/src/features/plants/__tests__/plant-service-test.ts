import * as plantService from '@/features/plants/plant-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('createPlant', () => {
  it('POSTs the new plant to /v1/plants and returns the saved plant', async () => {
    const request = { name: 'Vera', light: 'bright_indirect' as const, wateringEveryDays: 7, notes: null, planterId: 'room-1' };
    const saved = { id: 'p1', ...request };
    mockedApiFetch.mockResolvedValue(saved);

    await expect(plantService.createPlant(request)).resolves.toEqual(saved);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/plants', { method: 'POST', body: request });
  });
});
