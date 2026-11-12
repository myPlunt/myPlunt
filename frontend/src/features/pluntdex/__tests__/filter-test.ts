import { filterSpecies, regionsOf } from '@/features/pluntdex/filter';
import type { Species } from '@/lib/species/types';

function species(id: string, commonName: string, regions: string[], common = false): Species {
  return { id, commonName, scientificName: `${commonName} scientifica`, wateringFrequencyDays: null, regions, sunlightNeeds: null, common, imageUrl: null };
}

const all = [
  species('basil', 'Basil', ['Southeast Asia'], true),
  species('monstera', 'Monstera', ['Canada, USA and Mexico', 'Central America']),
  species('pothos', 'Pothos', ['Southeast Asia'], true),
  species('mystery', 'Mystery', []),
];
const discovered = new Set(['monstera']);

const ids = (list: Species[]) => list.map((s) => s.id);

const none = { only: null, region: null };

it('filters by chip and by region', () => {
  expect(ids(filterSpecies(all, discovered, '', { ...none, only: 'common' }))).toEqual(['basil', 'pothos']);
  expect(ids(filterSpecies(all, discovered, '', { ...none, only: 'discovered' }))).toEqual(['monstera']);
  expect(ids(filterSpecies(all, discovered, '', { ...none, region: 'Southeast Asia' }))).toEqual(['basil', 'pothos']);
});

it('shows a species native to several regions under each of them', () => {
  expect(ids(filterSpecies(all, discovered, '', { ...none, region: 'Central America' }))).toEqual(['monstera']);
  expect(ids(filterSpecies(all, discovered, '', { ...none, region: 'Canada, USA and Mexico' }))).toEqual(['monstera']);
  expect(regionsOf(all, discovered)).toEqual([
    { name: 'Canada, USA and Mexico', discovered: 1, total: 1 },
    { name: 'Central America', discovered: 1, total: 1 },
    { name: 'Southeast Asia', discovered: 0, total: 2 },
  ]);
});

it('combines the search, the chip and the region', () => {
  expect(ids(filterSpecies(all, discovered, ' POTH ', { ...none, only: 'common' }))).toEqual(['pothos']);
  expect(ids(filterSpecies(all, discovered, '', { only: 'discovered', region: 'Southeast Asia' }))).toEqual([]);
  expect(ids(filterSpecies(all, discovered, 'scientifica', { only: null, region: 'Central America' }))).toEqual(['monstera']);
});
