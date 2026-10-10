import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { useSpecies } from '@/features/species/use-species';

import { AddPlantScreen } from '../add-plant-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/species/use-species');

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
const createPlant = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  mockedUsePlantActions.mockReturnValue({ createPlant });
  mockedUseSpecies.mockReturnValue({
    species: [{ id: 's1', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7 }],
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

  it('closes once the plant is saved', async () => {
    createPlant.mockResolvedValue({
      id: 'p1',
      name: 'Vera',
      light: null,
      wateringEveryDays: null,
      notes: null,
      planterId: null,
      speciesId: null,
    });
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(back).toHaveBeenCalled());
  });

  it('offers the garden\'s rooms as planters on step 2, but not the "Other plants" group', async () => {
    await render(<AddPlantScreen />);
    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('radio', { name: 'Balcony' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Other plants' })).toBeNull();
  });

  it('shows a loading indicator for the planters while the garden loads', async () => {
    mockedUseGarden.mockReturnValue({ garden: null, error: null, isLoading: true, retry: jest.fn(), refresh: jest.fn() });
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
