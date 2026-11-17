import { render, screen, userEvent } from '@testing-library/react-native';

import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { ApiError } from '@/lib/auth/api-client';

import { EditPlanterDialog } from '../edit-planter-dialog';

jest.mock('@/features/planters/use-planter-actions');

const user = userEvent.setup();
const renamePlanter = jest.fn();
const deletePlanter = jest.fn();
const onClose = jest.fn();
const onChanged = jest.fn();

beforeEach(() => {
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter: jest.fn(), renamePlanter, deletePlanter });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderDialog(plantCount = 2) {
  return render(
    <EditPlanterDialog
      planter={{ id: 'balcony', name: 'Balcony', outdoor: false, plantCount }}
      onClose={onClose}
      onChanged={onChanged}
    />,
  );
}

describe('EditPlanterDialog', () => {
  it('renames the planter with the trimmed name', async () => {
    renamePlanter.mockResolvedValue({ id: 'balcony', name: 'Sunny balcony' });
    await renderDialog();

    await user.clear(screen.getByLabelText('Planter name'));
    await user.type(screen.getByLabelText('Planter name'), ' Sunny balcony ');
    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(renamePlanter).toHaveBeenCalledWith('balcony', { name: 'Sunny balcony', outdoor: false });
    expect(onChanged).toHaveBeenCalled();
  });

  it('moves the planter outdoors without renaming it', async () => {
    renamePlanter.mockResolvedValue({ id: 'balcony', name: 'Balcony', outdoor: true });
    await renderDialog();

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    await user.press(screen.getByRole('switch', { name: 'Outdoor' }));
    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(renamePlanter).toHaveBeenCalledWith('balcony', { name: 'Balcony', outdoor: true });
    expect(onChanged).toHaveBeenCalled();
  });

  it('tells the user when the name is longer than 30 characters and blocks saving', async () => {
    await renderDialog();

    await user.clear(screen.getByLabelText('Planter name'));
    await user.type(screen.getByLabelText('Planter name'), 'A'.repeat(31));

    expect(screen.getByText('Name must be at most 30 characters.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('shows the backend message when the name is already taken', async () => {
    renamePlanter.mockRejectedValue(
      new ApiError(409, 'Conflict', { detail: 'You already have a planter called Kitchen' }),
    );
    await renderDialog();

    await user.clear(screen.getByLabelText('Planter name'));
    await user.type(screen.getByLabelText('Planter name'), 'Kitchen');
    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('You already have a planter called Kitchen')).toBeOnTheScreen();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('deletes the planter only after confirming, telling the user its plants are kept', async () => {
    deletePlanter.mockResolvedValue(undefined);
    await renderDialog();

    await user.press(screen.getByRole('button', { name: 'Delete planter' }));
    expect(deletePlanter).not.toHaveBeenCalled();
    expect(screen.getByText(/2 plants move to Other plants/)).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(deletePlanter).toHaveBeenCalledWith('balcony');
    expect(onChanged).toHaveBeenCalled();
  });
});
