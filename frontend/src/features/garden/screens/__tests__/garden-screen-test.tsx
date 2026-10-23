import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { useGarden } from '@/features/garden/use-garden';
import { queueWaterings } from '@/features/garden/watering-outbox';
import type { Garden, GardenPlant } from '@/lib/garden/types';
import { useNetworkStore } from '@/stores/network-store';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { GardenScreen } from '../garden-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/garden/use-garden');
jest.mock('@/features/garden/watering-outbox');
jest.mock('@/stores/onboarding-store', () => ({
  ...jest.requireActual('@/stores/onboarding-store'),
  useOnboardingStore: jest.fn(),
}));
jest.mock('@/stores/network-store', () => ({
  ...jest.requireActual('@/stores/network-store'),
  useNetworkStore: jest.fn(),
}));

const mockedUseGarden = jest.mocked(useGarden);
const mockedQueueWaterings = jest.mocked(queueWaterings);
const retry = jest.fn();
const refresh = jest.fn();
const push = jest.fn();
const explainOffline = jest.fn();
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
    wateringStreak: 0,
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

function mockNetwork(isOffline: boolean) {
  jest.mocked(useNetworkStore).mockReturnValue({ isOffline, reconnects: 0, notice: null, explainOffline });
}

function queuedPlantIds() {
  return mockedQueueWaterings.mock.calls.map(([plants]) => plants.map((queued) => queued.id));
}

function mockGarden(state: Partial<ReturnType<typeof useGarden>>) {
  mockedUseGarden.mockReturnValue({ garden, error: null, isLoading: false, retry, refresh, ...state });
}

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(useOnboardingStore).mockReturnValue({ step: null, start: jest.fn(), next: jest.fn(), skipPast: jest.fn(), back: jest.fn(), finish: jest.fn(), previous: null, plantId: null });
  mockGarden({});
  mockNetwork(false);
  mockedQueueWaterings.mockResolvedValue(undefined);
  refresh.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('GardenScreen', () => {

  it('shows every room with how many plants need water', async () => {
    await render(<GardenScreen />);

    expect(screen.getByRole('header', { name: 'Balcony' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Living room' })).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: 'Kitchen windowsill' })).toBeOnTheScreen();
    expect(screen.getAllByText('2 plants · 1 needs water')).toHaveLength(2);
    expect(screen.getByText('0 plants')).toBeOnTheScreen();
    expect(screen.getByText('No plants in this room yet.')).toBeOnTheScreen();
  });

  it("opens a plant's details when its card is pressed", async () => {
    await render(<GardenScreen />);

    await user.press(screen.getByRole('button', { name: 'George' }));

    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]', params: { id: 'george' } });
  });

  it('orders the plants in a room by when they need water next', async () => {
    await render(<GardenScreen />);

    const kitchen = screen.getAllByText(/^(Basil|Minty)$/).map((node) => node.props.children);
    expect(kitchen).toEqual(['Basil', 'Minty']);
    const balcony = screen.getAllByText(/^(George|Pinky)$/).map((node) => node.props.children);
    expect(balcony).toEqual(['Pinky', 'George']);
  });

  it('marks only a plant whose watering made offline is still waiting to sync', async () => {
    mockGarden({ garden: { rooms: [{ id: 'balcony', name: 'Balcony', plants: [{ ...plant('pinky', 'Pinky', 4), waitingToSync: true }, plant('george', 'George', 2)] }] } });
    await render(<GardenScreen />);

    expect(screen.getAllByText('Not synced yet')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Pinky' })).toHaveAccessibilityValue({ text: 'Last watering not synced yet' });
    expect(screen.getByRole('button', { name: 'George' })).not.toHaveAccessibilityValue({ text: 'Last watering not synced yet' });
  });

  it('lists the plants due today or overdue in the water card', async () => {
    await render(<GardenScreen />);

    expect(screen.getByText('2 need water today')).toBeOnTheScreen();
    expect(screen.getByText('Pinky and Basil')).toBeOnTheScreen();
  });

  it('queues the due plants and then refreshes the garden', async () => {
    await render(<GardenScreen />);

    await user.press(screen.getByRole('button', { name: 'Water Pinky and Basil' }));

    expect(queuedPlantIds()).toEqual([['pinky', 'basil']]);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
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

    it('waters only the selected plants, refreshes the garden and stops picking', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));
      await user.press(screen.getByRole('checkbox', { name: 'George' }));
      await user.press(screen.getByRole('checkbox', { name: 'Minty' }));

      await user.press(screen.getByRole('button', { name: 'Water 2 plants' }));

      expect(queuedPlantIds()).toEqual([['george', 'minty']]);
      await waitFor(() => expect(refresh).toHaveBeenCalled());
      expect(await screen.findByRole('button', { name: 'George' })).toBeOnTheScreen();
    });

    it('selects and waters every plant in the garden with the Select all in the header', async () => {
      await render(<GardenScreen />);
      await user.press(screen.getByRole('button', { name: 'Water plants' }));

      await user.press(screen.getByRole('button', { name: 'Select all plants in the garden' }));
      expect(screen.getByText('4 plants selected')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Deselect all plants in Balcony' })).toBeOnTheScreen();

      await user.press(screen.getByRole('button', { name: 'Water 4 plants' }));
      expect(queuedPlantIds()[0]).toEqual(expect.arrayContaining(['george', 'pinky', 'basil', 'minty']));
    });
  });

  it('offline, watering still works', async () => {
    mockNetwork(true);
    await render(<GardenScreen />);

    await user.press(screen.getByRole('button', { name: 'Water Pinky and Basil' }));
    expect(queuedPlantIds()).toEqual([['pinky', 'basil']]);

    await user.press(screen.getByRole('button', { name: 'Water plants' }));
    expect(screen.getByText('Tap to select the plants you watered.')).toBeOnTheScreen();
    expect(explainOffline).not.toHaveBeenCalled();
  });

  it('shows the error and retries when asked', async () => {
    mockGarden({ garden: null, error: 'Something went wrong. Please try again.' });
    await render(<GardenScreen />);

    expect(screen.getByText('Something went wrong. Please try again.')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });

  it('skipping the first-plant step skips the photo and watering steps too, which need the plant', async () => {
    const skipPast = jest.fn();
    jest.mocked(useOnboardingStore).mockReturnValue({ step: 'plant', start: jest.fn(), next: jest.fn(), skipPast, back: jest.fn(), finish: jest.fn(), previous: null, plantId: null });
    await render(<GardenScreen />);

    await user.press(screen.getByRole('button', { name: 'Not now' }));

    expect(skipPast).toHaveBeenCalledWith('water');
  });

  it("during the tour's watering step, watering moves the tour on", async () => {
    const next = jest.fn();
    jest.mocked(useOnboardingStore).mockReturnValue({ step: 'water', start: jest.fn(), next, skipPast: jest.fn(), back: jest.fn(), finish: jest.fn(), previous: null, plantId: null });
    await render(<GardenScreen />);

    expect(screen.getByText('Water your plants')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Water Pinky and Basil' }));

    await waitFor(() => expect(next).toHaveBeenCalled());
  });
});
