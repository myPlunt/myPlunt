import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { usePlant } from '@/features/plants/use-plant';
import type { PlantDetails } from '@/lib/plant/types';

import { PlantDetailsScreen } from '../plant-details-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/plants/use-plant');

const mockedUsePlant = jest.mocked(usePlant);
const push = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();

// Dates relative to the real "now", in local time, as the screen reads the clock itself.
function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

const vera: PlantDetails = {
  id: 'p1',
  name: 'Vera',
  light: 'bright_indirect',
  wateringEveryDays: null,
  notes: 'Found at a flea market',
  planterId: 'balcony',
  planterName: 'Balcony',
  speciesId: 'monstera',
  speciesName: 'Monstera',
  wateringFrequencyDays: 7,
  lastWateredAt: daysFromNow(-2),
  nextWateringAt: daysFromNow(5),
  photoUrl: 'https://storage.test/vera.jpg',
};

function mockPlant(state: Partial<ReturnType<typeof usePlant>>) {
  mockedUsePlant.mockReturnValue({ plant: vera, error: null, isLoading: false, retry, ...state });
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockPlant({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PlantDetailsScreen', () => {
  it('loads the plant it was opened for', async () => {
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(mockedUsePlant).toHaveBeenCalledWith('p1');
  });

  it('shows the plant with its photo, species and details, including when it needs water next', async () => {
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(screen.getByRole('header', { name: 'Vera' })).toBeOnTheScreen();
    expect(screen.getByLabelText('Photo of Vera')).toBeOnTheScreen();
    expect(screen.getByText('Monstera')).toBeOnTheScreen();
    expect(screen.getByText('VERA INFORMATION')).toBeOnTheScreen();
    expect(screen.getByText('Next watering')).toBeOnTheScreen();
    expect(screen.getByText('In 5 days')).toBeOnTheScreen();
    expect(screen.getByText('Balcony')).toBeOnTheScreen();
    expect(screen.getByText('Bright indirect')).toBeOnTheScreen();
    expect(screen.getByText('Every 7 days (default)')).toBeOnTheScreen();
    expect(screen.getByText('2 days ago')).toBeOnTheScreen();
    expect(screen.getByText('Found at a flea market')).toBeOnTheScreen();
  });

  it('fills in sensible words for what the plant does not have', async () => {
    mockPlant({
      plant: {
        ...vera,
        light: null,
        notes: null,
        planterId: null,
        planterName: null,
        speciesId: null,
        speciesName: null,
        lastWateredAt: null,
        photoUrl: null,
      },
    });
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(screen.getByText('Other plants')).toBeOnTheScreen();
    expect(screen.getByText('Not set')).toBeOnTheScreen();
    expect(screen.getByText('Not yet')).toBeOnTheScreen();
    expect(screen.queryByText('NOTES')).toBeNull();
    expect(screen.queryByLabelText('Photo of Vera')).toBeNull();
  });

  it("doesn't call the owner's own watering frequency a default", async () => {
    mockPlant({ plant: { ...vera, wateringEveryDays: 3, wateringFrequencyDays: 3 } });
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(screen.getByText('Every 3 days')).toBeOnTheScreen();
  });

  it('opens the edit screen from the pencil', async () => {
    await render(<PlantDetailsScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: 'Edit plant' }));

    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]/edit', params: { id: 'p1' } });
  });

  it('shows a loading indicator, and no pencil, while the plant loads', async () => {
    mockPlant({ plant: null, isLoading: true });
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(screen.getByLabelText('Loading plant')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Edit plant' })).toBeNull();
  });

  it('shows the error and retries when asked', async () => {
    mockPlant({ plant: null, error: 'Plant not found' });
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(screen.getByText('Plant not found')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
