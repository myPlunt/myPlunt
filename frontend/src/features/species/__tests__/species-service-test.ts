import * as speciesService from '@/features/species/species-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('getSpecies', () => {
  it('fetches the approved species from /v1/species', async () => {
    const species = [{ id: 's1', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7, region: null, common: false, imageUrl: null }];
    mockedApiFetch.mockResolvedValue(species);

    await expect(speciesService.getSpecies()).resolves.toEqual(species);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/species');
  });
});

describe('getCaughtSpeciesIds', () => {
  it('fetches the caught species ids from /v1/species/caught', async () => {
    mockedApiFetch.mockResolvedValue(['s1']);

    await expect(speciesService.getCaughtSpeciesIds()).resolves.toEqual(['s1']);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/species/caught');
  });
});
