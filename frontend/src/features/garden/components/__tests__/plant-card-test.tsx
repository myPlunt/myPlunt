import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import type { GardenPlant } from '@/lib/garden/types';

import { PlantCard } from '../plant-card';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));

const push = jest.fn();
const user = userEvent.setup();
const now = new Date(2026, 9, 9, 15, 0);

const george: GardenPlant = {
  id: 'george',
  name: 'George',
  speciesId: null,
  speciesName: 'Geranium',
  wateringFrequencyDays: 4,
  lastWateredAt: null,
  nextWateringAt: new Date(2026, 9, 12).toISOString(),
  wateringStreak: 5,
  photoUrl: null,
};

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PlantCard', () => {
  it('shows the watering streak and announces it with the plant', async () => {
    await render(<PlantCard plant={george} now={now} />);

    expect(screen.getByText('5')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'George' })).toHaveAccessibilityValue({
      text: 'Watered on time 5 times in a row',
    });
  });

  it('says "time" for a streak of one', async () => {
    await render(<PlantCard plant={{ ...george, wateringStreak: 1 }} now={now} />);

    expect(screen.getByRole('button', { name: 'George' })).toHaveAccessibilityValue({
      text: 'Watered on time 1 time in a row',
    });
  });

  it('shows no streak badge without a streak', async () => {
    await render(<PlantCard plant={{ ...george, wateringStreak: 0 }} now={now} />);

    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByRole('button', { name: 'George' })).not.toHaveAccessibilityValue({
      text: expect.anything(),
    });
  });

  it("opens the plant's details", async () => {
    await render(<PlantCard plant={george} now={now} />);

    await user.press(screen.getByRole('button', { name: 'George' }));

    expect(push).toHaveBeenCalledWith({
      pathname: '/plant/[id]',
      params: { id: 'george' },
    });
  });
});
