import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { usePlantActions } from '@/features/plants/use-plant-actions';

import { AddPlantScreen } from '../add-plant-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/plants/use-plant-actions');

const mockedUseRouter = jest.mocked(useRouter);
const mockedUsePlantActions = jest.mocked(usePlantActions);
const back = jest.fn();
const createPlant = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ back, canGoBack: () => true } as unknown as ReturnType<typeof useRouter>);
  mockedUsePlantActions.mockReturnValue({ createPlant });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AddPlantScreen', () => {
  it('shows only the notebook heading, with no page title in the header', async () => {
    await render(<AddPlantScreen />);

    expect(screen.getAllByRole('header').map((header) => header.props.children)).toEqual(['Meet your new plant']);
  });

  it('closes once the plant is saved', async () => {
    createPlant.mockResolvedValue({ id: 'p1', name: 'Vera', light: null, wateringEveryDays: null, notes: null });
    await render(<AddPlantScreen />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(back).toHaveBeenCalled());
  });
});
