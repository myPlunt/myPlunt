import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';

import { PluntdexScreen } from '../pluntdex-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/species/use-discovered-species');
jest.mock('@/features/species/use-species');

const mockedUseDiscoveredSpecies = jest.mocked(useDiscoveredSpecies);
const mockedUseSpecies = jest.mocked(useSpecies);
const user = userEvent.setup();

const species = [
  {
    id: 'basil',
    commonName: 'Basil',
    scientificName: 'Ocimum basilicum',
    wateringFrequencyDays: 3,
    region: 'Tropical Asia',
    sunlightNeeds: 'Full sun',
    common: true,
    imageUrl: 'https://storage.test/basil.jpg',
  },
  {
    id: 'monstera',
    commonName: 'Monstera',
    scientificName: 'Monstera deliciosa',
    wateringFrequencyDays: 7,
    region: 'Central America',
    sunlightNeeds: null,
    common: false,
    imageUrl: null,
  },
];

beforeEach(() => {
  mockedUseSpecies.mockReturnValue({ species, error: null, retry: jest.fn() });
  mockedUseDiscoveredSpecies.mockReturnValue({ discovered: [{ speciesId: 'basil', discoveredAt: '2026-10-11T09:30:00Z' }], error: null, isLoading: false, retry: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

it('lists every species and marks the discovered ones', async () => {
  await render(<PluntdexScreen />);

  expect(screen.getByText('1 / 2 discovered')).toBeOnTheScreen();
  expect(screen.getByLabelText('Basil, discovered')).toBeOnTheScreen();
  expect(screen.getByLabelText('Monstera, not discovered yet')).toBeOnTheScreen();
  expect(screen.getByText('#002')).toBeOnTheScreen();
});

it('opens a species page from its card', async () => {
  const push = jest.fn();
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  await render(<PluntdexScreen />);

  await user.press(screen.getByLabelText('Monstera, not discovered yet'));

  expect(push).toHaveBeenCalledWith({ pathname: '/species/[id]', params: { id: 'monstera' } });
});

it('filters by a region picked from the dropdown, and back to all regions', async () => {
  await render(<PluntdexScreen />);

  await user.press(screen.getByRole('button', { name: 'Region' }));
  await user.press(screen.getByRole('radio', { name: 'Central America, 0 of 1 discovered' }));
  expect(screen.queryByLabelText('Basil, discovered')).toBeNull();
  expect(screen.getByLabelText('Monstera, not discovered yet')).toBeOnTheScreen();
  // Keeps its number from the full list.
  expect(screen.getByText('#002')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Region' }));
  await user.press(screen.getByRole('radio', { name: 'All regions' }));
  expect(screen.getByLabelText('Basil, discovered')).toBeOnTheScreen();
});

it('searches by name and says when nothing matches', async () => {
  await render(<PluntdexScreen />);

  await user.type(screen.getByLabelText('Search species'), 'cactus');

  expect(screen.getByText('No species match')).toBeOnTheScreen();
});
