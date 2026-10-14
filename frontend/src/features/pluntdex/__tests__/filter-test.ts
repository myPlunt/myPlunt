import { filterSpecies } from '@/features/pluntdex/filter';
import type { Species } from '@/lib/species/types';

function species(id: string, commonName: string, region: string | null, common = false): Species {
  return { id, commonName, scientificName: `${commonName} scientifica`, wateringFrequencyDays: null, region, sunlightNeeds: null, common, imageUrl: null };
}

const all = [
  species('basil', 'Basil', 'Tropical Asia', true),
  species('monstera', 'Monstera', 'Central America'),
  species('pothos', 'Pothos', 'Tropical Asia', true),
  species('mystery', 'Mystery', null),
];
const discovered = new Set(['monstera']);

const ids = (list: Species[]) => list.map((s) => s.id);

const none = { only: null, region: null };

it('filters by chip and by region', () => {
  expect(ids(filterSpecies(all, discovered, '', { ...none, only: 'common' }))).toEqual(['basil', 'pothos']);
  expect(ids(filterSpecies(all, discovered, '', { ...none, only: 'discovered' }))).toEqual(['monstera']);
  expect(ids(filterSpecies(all, discovered, '', { ...none, region: 'Tropical Asia' }))).toEqual(['basil', 'pothos']);
});

it('combines the search, the chip and the region', () => {
  expect(ids(filterSpecies(all, discovered, ' POTH ', { ...none, only: 'common' }))).toEqual(['pothos']);
  expect(ids(filterSpecies(all, discovered, '', { only: 'discovered', region: 'Tropical Asia' }))).toEqual([]);
  expect(ids(filterSpecies(all, discovered, 'scientifica', { only: null, region: 'Central America' }))).toEqual(['monstera']);
});
