import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { usePlantActions } from '@/features/plants/use-plant-actions';

import { AddPlantScreen } from '../add-plant-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/plants/use-plant-actions');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUsePlantActions = jest.mocked(usePlantActions);
const mockedUseGarden = jest.mocked(useGarden);
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
    createPlant.mockResolvedValue({ id: 'p1', name: 'Vera', light: null, wateringEveryDays: null, notes: null, planterId: null });
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(back).toHaveBeenCalled());
  });

  it('offers the garden\'s rooms as planters, but not the "Other plants" group', async () => {
    await render(<AddPlantScreen />);

    expect(screen.getByRole('radio', { name: 'Balcony' })).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: 'Other plants' })).toBeNull();
  });

  it('shows a loading indicator for the planters while the garden loads', async () => {
    mockedUseGarden.mockReturnValue({ garden: null, error: null, isLoading: true, retry: jest.fn(), refresh: jest.fn() });
    await render(<AddPlantScreen />);

    expect(screen.getByLabelText('Loading planters')).toBeOnTheScreen();
  });
});
