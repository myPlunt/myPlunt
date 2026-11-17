import { render, screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { ApiError } from '@/lib/auth/api-client';

import { PlanterSelect } from '../planter-select';

jest.mock('@/features/planters/use-planter-actions');

const user = userEvent.setup();
const createPlanter = jest.fn();
const onSelect = jest.fn();
const onAdded = jest.fn();
const planters = [
  { id: 'balcony', name: 'Balcony', outdoor: false },
  { id: 'kitchen', name: 'Kitchen windowsill', outdoor: false },
];

beforeEach(() => {
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter, renamePlanter: jest.fn(), deletePlanter: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderSelect(props: Partial<ComponentProps<typeof PlanterSelect>> = {}) {
  return render(
    <PlanterSelect planters={planters} selectedId={null} onSelect={onSelect} onAdded={onAdded} {...props} />,
  );
}

async function openAndStartAdding() {
  await user.press(screen.getByRole('button', { name: 'Planter' }));
  await user.press(screen.getByRole('button', { name: 'Add a planter' }));
}

describe('PlanterSelect', () => {

  it('selects a planter and closes', async () => {
    await renderSelect();
    await user.press(screen.getByRole('button', { name: 'Planter' }));

    await user.press(screen.getByRole('radio', { name: 'Kitchen windowsill' }));

    expect(onSelect).toHaveBeenCalledWith('kitchen');
    expect(screen.queryByRole('radio', { name: 'Balcony' })).toBeNull();
  });

  it('adds a new outdoor planter, hands it back and selects it', async () => {
    createPlanter.mockResolvedValue({ id: 'shed', name: 'Shed', outdoor: true });
    await renderSelect();
    await openAndStartAdding();

    await user.type(screen.getByLabelText('New planter name'), 'Shed');
    await user.press(screen.getByRole('switch', { name: 'Outdoor' }));
    await user.press(screen.getByRole('button', { name: 'Add' }));

    expect(createPlanter).toHaveBeenCalledWith({ name: 'Shed', outdoor: true });
    expect(onAdded).toHaveBeenCalledWith({ id: 'shed', name: 'Shed', outdoor: true });
    expect(onSelect).toHaveBeenCalledWith('shed');
    expect(screen.queryByLabelText('New planter name')).toBeNull();
  });

  it("shows the backend's message when the planter can't be added, and stays open", async () => {
    createPlanter.mockRejectedValue(
      new ApiError(409, 'Conflict', { detail: 'You already have a planter called Balcony' }),
    );
    await renderSelect();
    await openAndStartAdding();

    await user.type(screen.getByLabelText('New planter name'), 'Balcony');
    await user.press(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('You already have a planter called Balcony')).toBeOnTheScreen();
    expect(onAdded).not.toHaveBeenCalled();
    expect(screen.getByLabelText('New planter name')).toBeOnTheScreen();
  });
});
