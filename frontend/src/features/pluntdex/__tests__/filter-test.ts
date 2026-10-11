import { filterSpecies, regionsOf } from '@/features/pluntdex/filter';
import type { Species } from '@/lib/species/types';

function species(id: string, commonName: string, region: string | null, common = false): Species {
  return { id, commonName, scientificName: `${commonName} scientifica`, wateringFrequencyDays: null, region, common, imageUrl: null };
}

const all = [
  species('basil', 'Basil', 'Tropical Asia', true),
  species('monstera', 'Monstera', 'Central America'),
  species('pothos', 'Pothos', 'Tropical Asia', true),
  species('mystery', 'Mystery', null),
];
const caught = new Set(['monstera']);

const ids = (list: Species[]) => list.map((s) => s.id);

it('lists each region once, A to Z, skipping unknown ones', () => {
  expect(regionsOf(all)).toEqual(['Central America', 'Tropical Asia']);
});

const none = { only: null, region: null };

it('shows everything without a search or filter', () => {
  expect(ids(filterSpecies(all, caught, '', none))).toEqual(['basil', 'monstera', 'pothos', 'mystery']);
});

it('filters by chip and by region', () => {
  expect(ids(filterSpecies(all, caught, '', { ...none, only: 'common' }))).toEqual(['basil', 'pothos']);
  expect(ids(filterSpecies(all, caught, '', { ...none, only: 'caught' }))).toEqual(['monstera']);
  expect(ids(filterSpecies(all, caught, '', { ...none, region: 'Tropical Asia' }))).toEqual(['basil', 'pothos']);
});

it('combines the search, the chip and the region', () => {
  expect(ids(filterSpecies(all, caught, ' POTH ', { ...none, only: 'common' }))).toEqual(['pothos']);
  expect(ids(filterSpecies(all, caught, '', { only: 'caught', region: 'Tropical Asia' }))).toEqual([]);
  expect(ids(filterSpecies(all, caught, 'scientifica', { only: null, region: 'Central America' }))).toEqual(['monstera']);
});
