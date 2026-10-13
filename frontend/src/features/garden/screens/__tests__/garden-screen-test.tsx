import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { useGardenActions } from '@/features/garden/use-garden-actions';
import { ApiError } from '@/lib/auth/api-client';
import type { Garden, GardenPlant } from '@/lib/garden/types';

import { GardenScreen } from '../garden-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/garden/use-garden-actions');

const mockedUseGarden = jest.mocked(useGarden);
const mockedUseGardenActions = jest.mocked(useGardenActions);
const retry = jest.fn();
const refresh = jest.fn();
const waterPlants = jest.fn();
const push = jest.fn();
const user = userEvent.setup();

// Due dates relative to the real "now", in local time, as the screen reads the clock itself.
function inDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function plant(
  id: string,
  name: string,
  dueInDays: number,
  speciesName: string | null = null,
  photoUrl: string | null = null,
): GardenPlant {
  return {
    id,
    name,
    speciesId: null,
    speciesName,
    wateringFrequencyDays: 4,
    lastWateredAt: null,
    nextWateringAt: inDays(dueInDays),
    photoUrl,
  };
}

const garden: Garden = {
  rooms: [
    {
      id: 'balcony',
      name: 'Balcony',
      plants: [plant('george', 'George', 2, 'Geranium', 'https://storage.test/george.jpg'), plant('pinky', 'Pinky', 0)],
    },
    { id: 'living', name: 'Living room', plants: [] },
    { id: 'kitchen', name: 'Kitchen windowsill', plants: [plant('basil', 'Basil', -1), plant('minty', 'Minty', 1)] },
  ],
};

function mockGarden(state: Partial<ReturnType<typeof useGarden>>) {
  mockedUseGarden.mockReturnValue({ garden, error: null, isLoading: false, retry, refresh, ...state });
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  mockGarden({});
  mockedUseGardenActions.mockReturnValue({ waterPlants });
  waterPlants.mockResolvedValue(undefined);
  refresh.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('GardenScreen', () => {
  it('has no back button or add button of its own, because Garden is a tab', async () => {
    await render(<GardenScreen />);

    expect(screen.queryByRole('button', { name: 'Go back' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add plant' })).toBeNull();
  });

  it('summarises how many plants and rooms the garden has', async () => {
    await render(<GardenScreen />);

    expect(screen.getByText('4 plants in 3 rooms')).toBeOnTheScreen();
  });

  it('shows every room with how many plants need water', async () => {
    await render(<GardenScreen />);

    expect(screen.getByRole('header', { name: 'Balcony' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Living room' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Kitchen windowsill' })).toBeOnTheScreen();
    expect(screen.getAllByText('2 plants · 1 needs water')).toHaveLength(2);
    expect(screen.getByText('0 plants')).toBeOnTheScreen();
    expect(screen.getByText('No plants in this room yet.')).toBeOnTheScreen();
  });

  it('shows each plant with its species and when it needs water', async () => {
    await render(<GardenScreen />);

    expect(screen.getByText('George')).toBeOnTheScreen();
    expect(screen.getByText('Geranium')).toBeOnTheScreen();
    expect(screen.getByText('In 2 days')).toBeOnTheScreen();
    expect(screen.getByText('Today')).toBeOnTheScreen();
    expect(screen.getByText('Overdue')).toBeOnTheScreen();
    expect(screen.getByText('Tomorrow')).toBeOnTheScreen();
  });

  it("opens a plant's details when its card is pressed", async () => {
    await render(<GardenScreen />);

    await user.press(screen.getByRole('button', { name: 'George' }));

    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]', params: { id: 'george' } });
  });

  it('shows the photo of plants that have one and the placeholder for the rest', async () => {
    await render(<GardenScreen />);

    expect(screen.getByLabelText('Photo of George')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Photo of Pinky')).toBeNull();
  });

  it('keeps a blank species line on cards without a species, so the watering pills line up', async () => {
    await render(<GardenScreen />);

    // George has a species; Pinky, Basil and Minty get the blank line instead.
    expect(screen.getByText('Geranium')).toBeOnTheScreen();
    expect(screen.getAllByText(' ', { includeHiddenElements: true })).toHaveLength(3);
  });

  it('orders the plants in a room by when they need water next', async () => {
    await render(<GardenScreen />);

    const kitchen = screen.getAllByText(/^(Basil|Minty)$/).map((node) => node.props.children);
    expect(kitchen).toEqual(['Basil', 'Minty']);
    const balcony = screen.getAllByText(/^(George|Pinky)$/).map((node) => node.props.children);
    expect(balcony).toEqual(['Pinky', 'George']);
  });

  it('lists the plants due today or overdue in the water card', async () => {
    await render(<GardenScreen />);

    expect(screen.getByText('2 need water today')).toBeOnTheScreen();
    expect(screen.getByText('Pinky and Basil')).toBeOnTheScreen();
  });

  it('hides the water card when nothing needs water', async () => {
    mockGarden({ garden: { rooms: [{ id: 'balcony', name: 'Balcony', plants: [plant('george', 'George', 2, 'Geranium')] }] } });
    await render(<GardenScreen />);

    expect(screen.queryByText(/need(s)? water today/)).toBeNull();
  });

  it('waters the due plants and then refreshes the garden', async () => {
    await render(<GardenScreen />);

    await user.press(screen.getByRole('button', { name: 'Water Pinky and Basil' }));

    expect(waterPlants).toHaveBeenCalledWith(['pinky', 'basil']);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it('shows the backend message when watering fails', async () => {
    waterPlants.mockRejectedValue(new ApiError(404, 'irrelevant', { detail: 'Plant not found' }));
    await render(<GardenScreen />);

    await user.press(screen.getByRole('button', { name: 'Water Pinky and Basil' }));

    expect(await screen.findByText('Plant not found')).toBeOnTheScreen();
    expect(refresh).not.toHaveBeenCalled();
  });

  describe('picking plants to water', () => {
    it('turns the plant cards into checkboxes when the water drop is pressed', async () => {
      await render(<GardenScreen />);

      await user.press(screen.getByRole('button', { name: 'Water plants' }));

      expect(screen.getByRole('checkbox', { name: 'George' })).not.toBeChecked();
      expect(screen.getByText('Tap to select the plants you watered.')).toBeOnTheScreen();
      // Only one Water button while picking.
      expect(screen.queryByText('2 need water today')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Water plants' })).toBeNull();
    });

    it('selects a plant instead of opening it, and unselects it on a second press', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));

      await user.press(screen.getByRole('checkbox', { name: 'George' }));
      expect(screen.getByRole('checkbox', { name: 'George' })).toBeChecked();
      expect(screen.getByText('1 plant selected')).toBeOnTheScreen();
      expect(push).not.toHaveBeenCalled();

      await user.press(screen.getByRole('checkbox', { name: 'George' }));
      expect(screen.getByRole('checkbox', { name: 'George' })).not.toBeChecked();
    });

    it('waters only the selected plants, refreshes the garden and stops picking', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));
      await user.press(screen.getByRole('checkbox', { name: 'George' }));
      await user.press(screen.getByRole('checkbox', { name: 'Minty' }));

      await user.press(screen.getByRole('button', { name: 'Water 2 plants' }));

      expect(waterPlants).toHaveBeenCalledWith(['george', 'minty']);
      await waitFor(() => expect(refresh).toHaveBeenCalled());
      expect(await screen.findByRole('button', { name: 'George' })).toBeOnTheScreen();
    });

    it("restarts a watered plant's countdown once the garden is refreshed", async () => {
      // The backend now counts from today's watering: Basil (every 4 days) was overdue.
      const watered = { ...plant('basil', 'Basil', 4), lastWateredAt: inDays(0) };
      refresh.mockImplementation(async () => {
        mockGarden({ garden: { rooms: [{ id: 'kitchen', name: 'Kitchen windowsill', plants: [watered] }] } });
      });
      mockGarden({ garden: { rooms: [{ id: 'kitchen', name: 'Kitchen windowsill', plants: [plant('basil', 'Basil', -1)] }] } });
      await render(<GardenScreen />);
      expect(screen.getByText('Overdue')).toBeOnTheScreen();
      await user.press(screen.getByRole('button', { name: 'Water plants' }));
      await user.press(screen.getByRole('checkbox', { name: 'Basil' }));

      await user.press(screen.getByRole('button', { name: 'Water 1 plant' }));

      expect(await screen.findByText('In 4 days')).toBeOnTheScreen();
      expect(screen.queryByText('Overdue')).toBeNull();
      expect(screen.queryByText(/need(s)? water today/)).toBeNull();
    });

    it('keeps the selection and shows the backend message when watering fails', async () => {
      waterPlants.mockRejectedValue(new ApiError(404, 'irrelevant', { detail: 'Plant not found' }));
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));
      await user.press(screen.getByRole('checkbox', { name: 'George' }));

      await user.press(screen.getByRole('button', { name: 'Water 1 plant' }));

      expect(await screen.findByText('Plant not found')).toBeOnTheScreen();
      expect(screen.getByRole('checkbox', { name: 'George' })).toBeChecked();
      expect(refresh).not.toHaveBeenCalled();
    });

    it('selects and waters every plant in the garden with the Select all at the top', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));

      await user.press(screen.getByRole('button', { name: 'Select all plants in the garden' }));
      expect(screen.getByText('4 plants selected')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Deselect all plants in Balcony' })).toBeOnTheScreen();

      await user.press(screen.getByRole('button', { name: 'Water 4 plants' }));
      expect(waterPlants).toHaveBeenCalledWith(expect.arrayContaining(['george', 'pinky', 'basil', 'minty']));
    });

    it('clears the whole selection with Deselect all', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));
      await user.press(screen.getByRole('button', { name: 'Select all plants in the garden' }));

      await user.press(screen.getByRole('button', { name: 'Deselect all plants in the garden' }));

      expect(screen.getByText('Tap to select the plants you watered.')).toBeOnTheScreen();
      expect(screen.getByRole('checkbox', { name: 'George' })).not.toBeChecked();
    });

    it('selects all the plants of one planter, leaving the other planters alone', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));

      await user.press(screen.getByRole('button', { name: 'Select all plants in Kitchen windowsill' }));

      expect(screen.getByRole('checkbox', { name: 'Basil' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'Minty' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'George' })).not.toBeChecked();
      // A planter without plants has nothing to select.
      expect(screen.queryByRole('button', { name: 'Select all plants in Living room' })).toBeNull();

      await user.press(screen.getByRole('button', { name: 'Water 2 plants' }));
      expect(waterPlants).toHaveBeenCalledWith(['basil', 'minty']);
    });

    it("deselects a planter's plants once they are all selected, keeping the other picks", async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));
      await user.press(screen.getByRole('checkbox', { name: 'George' }));
      await user.press(screen.getByRole('button', { name: 'Select all plants in Kitchen windowsill' }));

      await user.press(screen.getByRole('button', { name: 'Deselect all plants in Kitchen windowsill' }));

      expect(screen.getByRole('checkbox', { name: 'Basil' })).not.toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'George' })).toBeChecked();
      expect(screen.getByText('1 plant selected')).toBeOnTheScreen();
    });

    it('has no Select all outside of picking plants', async () => {
      await render(<GardenScreen />);

      expect(screen.queryByRole('button', { name: /Select all/ })).toBeNull();
    });

    it('goes back to the normal garden when cancelled, without watering', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));
      await user.press(screen.getByRole('checkbox', { name: 'George' }));

      await user.press(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('button', { name: 'George' })).toBeOnTheScreen();
      expect(screen.getByText('2 need water today')).toBeOnTheScreen();
      expect(waterPlants).not.toHaveBeenCalled();
    });

    it('has no water drop when the garden has no plants', async () => {
      mockGarden({ garden: { rooms: [{ id: 'living', name: 'Living room', plants: [] }] } });
      await render(<GardenScreen />);

      expect(screen.queryByRole('button', { name: 'Water plants' })).toBeNull();
    });
  });

  it('shows an empty state when the garden has no rooms or plants', async () => {
    mockGarden({ garden: { rooms: [] } });
    await render(<GardenScreen />);

    expect(screen.getByText('Your garden is empty')).toBeOnTheScreen();
  });

  it('shows a loading indicator while the garden loads', async () => {
    mockGarden({ garden: null, isLoading: true });
    await render(<GardenScreen />);

    expect(screen.getByLabelText('Loading garden')).toBeOnTheScreen();
    expect(screen.queryByText('George')).toBeNull();
  });

  it('shows the error and retries when asked', async () => {
    mockGarden({ garden: null, error: 'Something went wrong. Please try again.' });
    await render(<GardenScreen />);

    expect(screen.getByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
