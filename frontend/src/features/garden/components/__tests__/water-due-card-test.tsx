import { render, screen, userEvent } from '@testing-library/react-native';

import type { GardenPlant } from '@/lib/garden/types';

import { WaterDueCard } from '../water-due-card';

const onWater = jest.fn();
const user = userEvent.setup();

function plant(name: string): GardenPlant {
  return {
    id: name,
    name,
    speciesId: null,
    speciesName: null,
    wateringFrequencyDays: 3,
    lastWateredAt: null,
    nextWateringAt: null,
    photoUrl: null,
  };
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('WaterDueCard', () => {
  it('says how many plants need water and which ones', async () => {
    await render(<WaterDueCard plants={[plant('Pinky'), plant('Basil')]} onWater={onWater} loading={false} error={null} />);

    expect(screen.getByText('2 need water today')).toBeOnTheScreen();
    expect(screen.getByText('Pinky and Basil')).toBeOnTheScreen();
  });

  it('uses the singular for a single plant', async () => {
    await render(<WaterDueCard plants={[plant('Pinky')]} onWater={onWater} loading={false} error={null} />);

    expect(screen.getByText('1 needs water today')).toBeOnTheScreen();
  });

  it('calls onWater when the Water button is pressed', async () => {
    await render(<WaterDueCard plants={[plant('Pinky')]} onWater={onWater} loading={false} error={null} />);

    await user.press(screen.getByRole('button', { name: 'Water Pinky' }));

    expect(onWater).toHaveBeenCalled();
  });

  it('disables the Water button while watering', async () => {
    await render(<WaterDueCard plants={[plant('Pinky')]} onWater={onWater} loading error={null} />);

    expect(screen.getByRole('button', { name: 'Water Pinky' })).toBeDisabled();
  });

  it('shows the error when watering failed', async () => {
    await render(<WaterDueCard plants={[plant('Pinky')]} onWater={onWater} loading={false} error="Plant not found" />);

    expect(screen.getByText('Plant not found')).toBeOnTheScreen();
  });
});
