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
  { id: 'balcony', name: 'Balcony' },
  { id: 'kitchen', name: 'Kitchen windowsill' },
];

beforeEach(() => {
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter });
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
  it('shows the chosen planter, or Other plants when there is none', async () => {
    const { rerender } = await renderSelect();
    expect(screen.getByRole('button', { name: 'Planter' })).toHaveAccessibilityValue({ text: 'Other plants' });

    await rerender(<PlanterSelect planters={planters} selectedId="kitchen" onSelect={onSelect} onAdded={onAdded} />);

    expect(screen.getByRole('button', { name: 'Planter' })).toHaveAccessibilityValue({ text: 'Kitchen windowsill' });
  });

  it('lists Other plants and every planter, with the chosen one checked', async () => {
    await renderSelect({ selectedId: 'balcony' });

    await user.press(screen.getByRole('button', { name: 'Planter' }));

    expect(screen.getByRole('radio', { name: 'Other plants' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Balcony' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Kitchen windowsill' })).not.toBeChecked();
  });

  it('selects a planter and closes', async () => {
    await renderSelect();
    await user.press(screen.getByRole('button', { name: 'Planter' }));

    await user.press(screen.getByRole('radio', { name: 'Kitchen windowsill' }));

    expect(onSelect).toHaveBeenCalledWith('kitchen');
    expect(screen.queryByRole('radio', { name: 'Balcony' })).toBeNull();
  });

  it('clears the planter when Other plants is chosen', async () => {
    await renderSelect({ selectedId: 'balcony' });
    await user.press(screen.getByRole('button', { name: 'Planter' }));

    await user.press(screen.getByRole('radio', { name: 'Other plants' }));

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('adds a new planter, hands it back and selects it', async () => {
    createPlanter.mockResolvedValue({ id: 'shed', name: 'Shed' });
    await renderSelect();
    await openAndStartAdding();

    await user.type(screen.getByLabelText('New planter name'), 'Shed');
    await user.press(screen.getByRole('button', { name: 'Add' }));

    expect(createPlanter).toHaveBeenCalledWith({ name: 'Shed' });
    expect(onAdded).toHaveBeenCalledWith({ id: 'shed', name: 'Shed' });
    expect(onSelect).toHaveBeenCalledWith('shed');
    expect(screen.queryByLabelText('New planter name')).toBeNull();
  });

  it('keeps Add disabled until the new planter has a name', async () => {
    await renderSelect();
    await openAndStartAdding();

    await user.type(screen.getByLabelText('New planter name'), '   ');
    await user.press(screen.getByRole('button', { name: 'Add' }));

    expect(createPlanter).not.toHaveBeenCalled();
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

  it('shows a name validation error next to the input', async () => {
    const error = new ApiError(400, 'Validation failed', { fieldErrors: { name: 'Name must be at most 255 characters.' } });
    createPlanter.mockRejectedValue(error);
    await renderSelect();
    await openAndStartAdding();

    await user.type(screen.getByLabelText('New planter name'), 'x');
    await user.press(screen.getByRole('button', { name: 'Add' }));

    expect(await screen.findByText('Name must be at most 255 characters.')).toBeOnTheScreen();
  });

  it('goes back to the list when adding is cancelled', async () => {
    await renderSelect();
    await openAndStartAdding();

    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('New planter name')).toBeNull();
    expect(screen.getByRole('button', { name: 'Add a planter' })).toBeOnTheScreen();
  });
});
