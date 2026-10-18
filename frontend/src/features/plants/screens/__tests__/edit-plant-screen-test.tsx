import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { usePlant } from '@/features/plants/use-plant';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { useSpecies } from '@/features/species/use-species';
import type { PlantDetails } from '@/lib/plant/types';

import { EditPlantScreen } from '../edit-plant-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/plants/use-plant');
jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/species/use-species');
jest.mock('@/features/planters/use-planter-actions');
// The real hook loads the native picker; the form's tests cover the photo.
jest.mock('@/features/photos/use-photo-upload', () => ({
  usePhotoUpload: () => ({ uri: null, key: null, isUploading: false, error: null }),
}));

const mockedUsePlant = jest.mocked(usePlant);
const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();
const updatePlant = jest.fn();
const retry = jest.fn();
const user = userEvent.setup();
const vera: PlantDetails = {
  id: 'p1',
  name: 'Vera',
  light: null,
  wateringEveryDays: null,
  notes: null,
  planterId: 'balcony',
  planterName: 'Balcony',
  speciesId: null,
  speciesName: null,
  wateringFrequencyDays: 7,
  lastWateredAt: null,
  nextWateringAt: '2026-10-11T08:00:00.000Z',
  photoUrl: null,
};

function mockPlant(state: Partial<ReturnType<typeof usePlant>>) {
  mockedUsePlant.mockReturnValue({ plant: vera, error: null, isLoading: false, retry, ...state });
}

beforeEach(() => {
  canGoBack.mockReturnValue(true);
  jest.mocked(useRouter).mockReturnValue({ back, replace, canGoBack } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(usePlantActions).mockReturnValue({ createPlant: jest.fn(), updatePlant, deletePlant: jest.fn() });
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter: jest.fn(), renamePlanter: jest.fn(), deletePlanter: jest.fn() });
  jest.mocked(useSpecies).mockReturnValue({ species: [], error: null, retry: jest.fn() });
  jest.mocked(useGarden).mockReturnValue({
    garden: { rooms: [{ id: 'balcony', name: 'Balcony', plants: [] }] },
    error: null,
    isLoading: false,
    retry: jest.fn(),
    refresh: jest.fn(),
  });
  mockPlant({});
  updatePlant.mockResolvedValue(vera);
});

afterEach(() => {
  jest.resetAllMocks();
});

/** Renames the plant and saves from step 2. */
async function renameAndSave(name: string) {
  await user.clear(screen.getByLabelText('Name'));
  await user.type(screen.getByLabelText('Name'), name);
  await user.press(screen.getByRole('button', { name: 'Next' }));
  await user.press(screen.getByRole('button', { name: 'Save changes' }));
}

describe('EditPlantScreen', () => {

  it('saves the changes to the plant and closes', async () => {
    await render(<EditPlantScreen plantId="p1" />);

    await renameAndSave('Vera II');

    await waitFor(() => expect(back).toHaveBeenCalled());
    expect(updatePlant).toHaveBeenCalledWith('p1', expect.objectContaining({ name: 'Vera II', planterId: 'balcony' }));
  });

  it('shows the error and retries when asked', async () => {
    mockPlant({ plant: null, error: 'Plant not found' });
    await render(<EditPlantScreen plantId="p1" />);

    expect(screen.getByText('Plant not found')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
