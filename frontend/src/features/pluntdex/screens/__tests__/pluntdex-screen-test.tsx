import { render, screen } from '@testing-library/react-native';

import { useGarden } from '@/features/garden/use-garden';
import { useSpecies } from '@/features/species/use-species';
import type { Garden } from '@/lib/garden/types';

import { PluntdexScreen } from '../pluntdex-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/species/use-species');

const mockedUseGarden = jest.mocked(useGarden);
const mockedUseSpecies = jest.mocked(useSpecies);

const species = [
  { id: 'basil', commonName: 'Basil', scientificName: 'Ocimum basilicum', wateringFrequencyDays: 3 },
  { id: 'monstera', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7 },
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
          nextWateringAt: null,
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
