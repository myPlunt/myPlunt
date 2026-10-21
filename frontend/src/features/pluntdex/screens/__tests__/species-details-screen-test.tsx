import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { useDiscoveredSpecies } from '@/features/species/use-discovered-species';
import { useSpecies } from '@/features/species/use-species';
import type { Garden } from '@/lib/garden/types';

import { SpeciesDetailsScreen } from '../species-details-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/species/use-discovered-species');
jest.mock('@/features/species/use-species');

const push = jest.fn();
const retry = jest.fn();
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
    wateringFrequencyDays: null,
    region: null,
    sunlightNeeds: null,
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
          nextWateringAt: '2026-10-14T12:00:00Z',
          wateringStreak: 0,
          photoUrl: null,
        },
        {
          id: 'p2',
          name: 'Vera',
          speciesId: 'monstera',
          speciesName: 'Monstera',
          wateringFrequencyDays: 7,
          lastWateredAt: null,
          nextWateringAt: '2026-10-14T12:00:00Z',
          wateringStreak: 0,
          photoUrl: null,
        },
      ],
    },
  ],
};

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useSpecies).mockReturnValue({ species, error: null, retry: jest.fn() });
  jest.mocked(useDiscoveredSpecies).mockReturnValue({
    discovered: [{ speciesId: 'basil', discoveredAt: '2026-10-11T09:30:00Z' }],
    error: null,
    isLoading: false,
    retry,
  });
  jest.mocked(useGarden).mockReturnValue({
    garden,
    error: null,
    isLoading: false,
    retry: jest.fn(),
    refresh: jest.fn(),
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

it('shows a discovered species with its facts, when it was discovered and the plants of it', async () => {
  await render(<SpeciesDetailsScreen speciesId="basil" />);

  expect(screen.getByRole('header', { name: 'Basil' })).toBeOnTheScreen();
  expect(screen.getByText('#001')).toBeOnTheScreen();
  expect(screen.getByText('Tropical Asia')).toBeOnTheScreen();
  expect(screen.getByText('Full sun')).toBeOnTheScreen();
  expect(screen.getByText('Every 3 days')).toBeOnTheScreen();
  expect(screen.getByText(/Discovered on/)).toBeOnTheScreen();
  expect(screen.getByLabelText('Picture of Basil')).toBeOnTheScreen();
  // Only this species' plants, and each opens its own page.
  expect(screen.queryByRole('button', { name: 'Vera' })).toBeNull();
  await user.press(screen.getByRole('button', { name: 'Bas' }));
  expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]', params: { id: 'p1' } });
});

it('offers to add an undiscovered species to the garden, with the species picked', async () => {
  await render(<SpeciesDetailsScreen speciesId="monstera" />);

  expect(screen.getByText('Not discovered yet')).toBeOnTheScreen();
  expect(screen.getAllByText('Unknown')).toHaveLength(3);
  expect(screen.queryByText(/Discovered on/)).toBeNull();
  await user.press(screen.getByRole('button', { name: 'Add to garden' }));

  expect(push).toHaveBeenCalledWith({
    pathname: '/add',
    params: { speciesId: 'monstera', speciesName: 'Monstera' },
  });
});

it('says when the species is not in the Pluntdex', async () => {
  await render(<SpeciesDetailsScreen speciesId="cactus" />);

  expect(screen.getByText("This species isn't in the Pluntdex.")).toBeOnTheScreen();
});
