import { render, screen, userEvent } from '@testing-library/react-native';

import { useGarden } from '@/features/garden/use-garden';
import { useSpecies } from '@/features/species/use-species';
import type { Garden } from '@/lib/garden/types';

import { PluntdexScreen } from '../pluntdex-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/species/use-species');

const mockedUseGarden = jest.mocked(useGarden);
const mockedUseSpecies = jest.mocked(useSpecies);
const user = userEvent.setup();

const species = [
  {
    id: 'basil',
    commonName: 'Basil',
    scientificName: 'Ocimum basilicum',
    wateringFrequencyDays: 3,
    region: 'Tropical Asia',
    common: true,
    imageUrl: 'https://storage.test/basil.jpg',
  },
  {
    id: 'monstera',
    commonName: 'Monstera',
    scientificName: 'Monstera deliciosa',
    wateringFrequencyDays: 7,
    region: 'Central America',
    common: false,
    imageUrl: null,
  },
];

const garden: Garden = {
  rooms: [
    {
      id: 'kitchen',
      name: 'Kitchen',
      plants: [
        {
          id: 'p1',
          name: 'Bas',
          speciesId: 'basil',
          speciesName: 'Basil',
          wateringFrequencyDays: 3,
          lastWateredAt: null,
          nextWateringAt: '2026-10-15T08:00:00.000Z',
          photoUrl: null,
        },
      ],
    },
  ],
};

beforeEach(() => {
  mockedUseSpecies.mockReturnValue({ species, error: null });
  mockedUseGarden.mockReturnValue({ garden, error: null, isLoading: false, retry: jest.fn(), refresh: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

it('lists every species and marks the ones in the garden as caught', async () => {
  await render(<PluntdexScreen />);

  expect(screen.getByText('1 / 2 discovered')).toBeOnTheScreen();
  expect(screen.getByLabelText('Basil, caught')).toBeOnTheScreen();
  expect(screen.getByLabelText('Monstera, not caught yet')).toBeOnTheScreen();
  expect(screen.getByText('#002')).toBeOnTheScreen();
});

it('shows the error and a retry when the garden fails to load', async () => {
  mockedUseGarden.mockReturnValue({ garden: null, error: 'Offline', isLoading: false, retry: jest.fn(), refresh: jest.fn() });
  await render(<PluntdexScreen />);

  expect(screen.getByText('Offline')).toBeOnTheScreen();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeOnTheScreen();
});

it('shows the picture of species that have one', async () => {
  await render(<PluntdexScreen />);

  expect(screen.getByLabelText('Picture of Basil')).toBeOnTheScreen();
  expect(screen.queryByLabelText('Picture of Monstera')).toBeNull();
});

it('filters by a region picked from the dropdown, and back to all regions', async () => {
  await render(<PluntdexScreen />);

  await user.press(screen.getByRole('button', { name: 'Region' }));
  await user.press(screen.getByRole('radio', { name: 'Central America' }));
  expect(screen.queryByLabelText('Basil, caught')).toBeNull();
  expect(screen.getByLabelText('Monstera, not caught yet')).toBeOnTheScreen();
  // Keeps its number from the full list.
  expect(screen.getByText('#002')).toBeOnTheScreen();

  await user.press(screen.getByRole('button', { name: 'Region' }));
  await user.press(screen.getByRole('radio', { name: 'All regions' }));
  expect(screen.getByLabelText('Basil, caught')).toBeOnTheScreen();
});

it('counts only the species that match the search', async () => {
  await render(<PluntdexScreen />);

  await user.type(screen.getByLabelText('Search species'), 'basil');

  expect(screen.getByText('1 / 1 discovered')).toBeOnTheScreen();
});

it('searches by name and says when nothing matches', async () => {
  await render(<PluntdexScreen />);

  await user.type(screen.getByLabelText('Search species'), 'cactus');

  expect(screen.getByText('No species match')).toBeOnTheScreen();
});
