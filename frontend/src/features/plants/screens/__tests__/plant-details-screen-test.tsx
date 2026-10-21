import { fireEvent, render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { usePlant } from '@/features/plants/use-plant';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { usePlantPhotos } from '@/features/plants/use-plant-photos';
import { ApiError } from '@/lib/auth/api-client';
import type { PlantDetails } from '@/lib/plant/types';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { PlantDetailsScreen } from '../plant-details-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn(), Stack: { Screen: () => null } }));
jest.mock('@/stores/onboarding-store', () => ({
  ...jest.requireActual('@/stores/onboarding-store'),
  useOnboardingStore: jest.fn(),
}));
jest.mock('@/features/plants/use-plant');
jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/plants/use-plant-photos');

const mockedUsePlant = jest.mocked(usePlant);
const push = jest.fn();
const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();
const deletePlant = jest.fn();
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
  mockedUsePlant.mockReturnValue({ plant: vera, savedAt: null, error: null, isLoading: false, retry, ...state });
}

beforeEach(() => {
  jest.mocked(useOnboardingStore).mockReturnValue({ step: null, start: jest.fn(), next: jest.fn(), skipPast: jest.fn(), back: jest.fn(), finish: jest.fn(), previous: null, plantId: null });
  jest.mocked(useRouter).mockReturnValue({ push, back, replace, canGoBack } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(usePlantActions).mockReturnValue({
    createPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant,
    addPlantPhoto: jest.fn(),
    updatePlantPhoto: jest.fn(),
    deletePlantPhoto: jest.fn(),
  });
  jest.mocked(usePlantPhotos).mockReturnValue({ photos: [], error: null, isLoading: false, retry });
  canGoBack.mockReturnValue(true);
  deletePlant.mockResolvedValue(undefined);
  mockPlant({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PlantDetailsScreen', () => {

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

  it('opens on the newest growth photo and steps back through older ones with the arrows', async () => {
    jest.mocked(usePlantPhotos).mockReturnValue({
      photos: [
        { id: 'a', url: 'https://storage.test/jan.jpg', takenAt: '2026-01-12T12:00:00Z', caption: 'Just brought her home' },
        { id: 'b', url: 'https://storage.test/jun.jpg', takenAt: '2026-06-14T12:00:00Z', caption: null },
      ],
      error: null,
      isLoading: false,
      retry,
    });
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(screen.getByText('2 / 2')).toBeOnTheScreen();
    expect(screen.getByText('Growing Vera for 5 months')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Previous photo' }));

    expect(screen.getByText('1 / 2')).toBeOnTheScreen();
    expect(screen.getByText('Just brought her home')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeDisabled();
  });

  it('shows the photo the user swiped to', async () => {
    jest.mocked(usePlantPhotos).mockReturnValue({
      photos: [
        { id: 'a', url: 'https://storage.test/jan.jpg', takenAt: '2026-01-12T12:00:00Z', caption: 'Just brought her home' },
        { id: 'b', url: 'https://storage.test/jun.jpg', takenAt: '2026-06-14T12:00:00Z', caption: null },
      ],
      error: null,
      isLoading: false,
      retry,
    });
    await render(<PlantDetailsScreen plantId="p1" />);
    const carousel = screen.getByLabelText('Photos of Vera');
    // The carousel measures its page width from its own layout.
    await fireEvent(carousel, 'layout', { nativeEvent: { layout: { width: 300, height: 300 } } });

    await fireEvent(carousel, 'momentumScrollEnd', { nativeEvent: { contentOffset: { x: 0, y: 0 } } });

    expect(screen.getByText('1 / 2')).toBeOnTheScreen();
  });

  it('opens the growth journal and the add-photo screen from the Growth section', async () => {
    jest.mocked(usePlantPhotos).mockReturnValue({
      photos: [{ id: 'a', url: 'https://storage.test/jan.jpg', takenAt: '2026-01-12T12:00:00Z', caption: null }],
      error: null,
      isLoading: false,
      retry,
    });
    await render(<PlantDetailsScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: 'See all growth photos' }));
    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]/growth', params: { id: 'p1' } });
    await user.press(screen.getByRole('button', { name: 'Add a new photo' }));
    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]/add-photo', params: { id: 'p1' } });
  });

  it('shows the error and retries when asked', async () => {
    mockPlant({ plant: null, error: 'Plant not found' });
    await render(<PlantDetailsScreen plantId="p1" />);

    expect(screen.getByText('Plant not found')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });

  it('deletes the plant after confirming and goes back to the garden', async () => {
    await render(<PlantDetailsScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: 'Delete plant' }));
    expect(screen.getByRole('header', { name: 'Delete Vera?' })).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(deletePlant).toHaveBeenCalledWith('p1');
    expect(back).toHaveBeenCalled();
  });

  it('keeps the plant when the user cancels', async () => {
    await render(<PlantDetailsScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: 'Delete plant' }));
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(deletePlant).not.toHaveBeenCalled();
    expect(screen.queryByRole('header', { name: 'Delete Vera?' })).toBeNull();
    expect(back).not.toHaveBeenCalled();
  });

  it('shows why the plant could not be deleted and stays on the page', async () => {
    const error = new ApiError(404, 'Not Found', { detail: 'Plant not found' });
    deletePlant.mockRejectedValue(error);
    await render(<PlantDetailsScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: 'Delete plant' }));
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Plant not found')).toBeOnTheScreen();
    expect(back).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
