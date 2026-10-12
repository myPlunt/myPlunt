import { render, screen, userEvent } from '@testing-library/react-native';

import { WaterSelectionBar } from '../water-selection-bar';

const onWater = jest.fn();
const onCancel = jest.fn();
const user = userEvent.setup();

afterEach(() => {
  jest.resetAllMocks();
});

describe('WaterSelectionBar', () => {
  it('asks the user to pick plants and disables watering while none are selected', async () => {
    await render(<WaterSelectionBar selectedCount={0} onWater={onWater} onCancel={onCancel} loading={false} error={null} />);

    expect(screen.getByText('Tap the plants you watered')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Water 0 plants' })).toBeDisabled();
  });

  it('counts the selected plants and waters them when pressed', async () => {
    await render(<WaterSelectionBar selectedCount={1} onWater={onWater} onCancel={onCancel} loading={false} error={null} />);

    expect(screen.getByText('1 plant selected')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Water 1 plant' }));

    expect(onWater).toHaveBeenCalled();
  });

  it('cancels when asked', async () => {
    await render(<WaterSelectionBar selectedCount={2} onWater={onWater} onCancel={onCancel} loading={false} error={null} />);

    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('disables both actions while watering', async () => {
    await render(<WaterSelectionBar selectedCount={2} onWater={onWater} onCancel={onCancel} loading error={null} />);

    expect(screen.getByRole('button', { name: 'Water 2 plants' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('shows the error', async () => {
    await render(
      <WaterSelectionBar selectedCount={2} onWater={onWater} onCancel={onCancel} loading={false} error="Plant not found" />,
    );

    expect(screen.getByText('Plant not found')).toBeOnTheScreen();
  });
});
