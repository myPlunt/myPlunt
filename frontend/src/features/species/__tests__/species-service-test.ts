import * as speciesService from '@/features/species/species-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('getSpecies', () => {
  it('fetches the approved species from /v1/species', async () => {
    const species = [{ id: 's1', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7, region: null, sunlightNeeds: null, common: false, imageUrl: null }];
    mockedApiFetch.mockResolvedValue(species);

    await expect(speciesService.getSpecies()).resolves.toEqual(species);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/species');
  });
});

describe('getDiscoveredSpecies', () => {
  it('fetches the discovered species from /v1/species/discovered', async () => {
    const discovered = [{ speciesId: 's1', discoveredAt: '2026-10-11T09:30:00Z' }];
    mockedApiFetch.mockResolvedValue(discovered);

    await expect(speciesService.getDiscoveredSpecies()).resolves.toEqual(discovered);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/species/discovered');
  });
});
