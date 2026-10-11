import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { useSpecies } from '@/features/species/use-species';

import { AddPlantScreen } from '../add-plant-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/species/use-species');
jest.mock('@/features/planters/use-planter-actions');
// The real hook loads the native picker; the form's tests cover the photo.
jest.mock('@/features/photos/use-photo-upload', () => ({
  usePhotoUpload: () => ({ uri: null, key: null, isUploading: false, error: null }),
}));

const mockedUseRouter = jest.mocked(useRouter);
const mockedUsePlantActions = jest.mocked(usePlantActions);
const mockedUseGarden = jest.mocked(useGarden);
const mockedUseSpecies = jest.mocked(useSpecies);
const garden = {
  rooms: [
    { id: 'balcony', name: 'Balcony', plants: [] },
    { id: null, name: 'Other plants', plants: [] },
  ],
};
const back = jest.fn();
const replace = jest.fn();
const canGoBack = jest.fn();
const createPlant = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  canGoBack.mockReturnValue(true);
  mockedUseRouter.mockReturnValue({ back, replace, canGoBack } as unknown as ReturnType<typeof useRouter>);
  mockedUsePlantActions.mockReturnValue({ createPlant, updatePlant: jest.fn() });
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter: jest.fn() });
  mockedUseSpecies.mockReturnValue({
    species: [{ id: 's1', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7, region: null, common: false, imageUrl: null }],
    error: null,
  });
  mockedUseGarden.mockReturnValue({ garden, error: null, isLoading: false, retry: jest.fn(), refresh: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AddPlantScreen', () => {
  it('shows only the notebook heading, with no page title in the header', async () => {
    await render(<AddPlantScreen />);

    expect(screen.getAllByRole('header').map((header) => header.props.children)).toEqual(['Add your new plant']);
  });

  it('goes back when the logo next to the heading is pressed', async () => {
    await render(<AddPlantScreen />);

    await user.press(screen.getByRole('button', { name: 'Go back' }));

    expect(back).toHaveBeenCalled();
  });

  it('closes once the plant is saved', async () => {
    createPlant.mockResolvedValue({
      id: 'p1',
      name: 'Vera',
      light: null,
      wateringEveryDays: null,
      notes: null,
      planterId: null,
      speciesId: null,
      photoUrl: null,
    });
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(back).toHaveBeenCalled());
  });

  it('goes to the garden once the plant is saved when there is no screen to go back to', async () => {
    canGoBack.mockReturnValue(false);
    createPlant.mockResolvedValue({
      id: 'p1',
      name: 'Vera',
      light: null,
      wateringEveryDays: null,
      notes: null,
      planterId: null,
      speciesId: null,
      photoUrl: null,
    });
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/garden'));
    expect(back).not.toHaveBeenCalled();
  });

  it('offers the garden\'s rooms as planters on step 2, but not the "Other plants" group', async () => {
    await render(<AddPlantScreen />);
    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));

    await user.press(screen.getByRole('button', { name: 'Planter' }));

    expect(screen.getByRole('radio', { name: 'Balcony' })).toBeOnTheScreen();
    // Just the dropdown's own "no planter" option, not a second one for the garden group.
    expect(screen.getAllByRole('radio', { name: 'Other plants' })).toHaveLength(1);
  });

  it('shows a loading indicator for the planters while the garden loads', async () => {
    mockedUseGarden.mockReturnValue({
      garden: null,
      error: null,
      isLoading: true,
      retry: jest.fn(),
      refresh: jest.fn(),
    });
    await render(<AddPlantScreen />);
    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByLabelText('Loading planters')).toBeOnTheScreen();
  });

  it('offers the loaded species in the species search', async () => {
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Species'), 'mon');

    expect(screen.getByRole('button', { name: 'Monstera' })).toBeOnTheScreen();
  });
});
