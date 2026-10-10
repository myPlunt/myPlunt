import { render, screen, userEvent, waitFor } from '@testing-library/react-native';

import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError } from '@/lib/auth/api-client';

import { AddPlantForm } from '../add-plant-form';

jest.mock('@/features/plants/use-plant-actions');

const mockedUsePlantActions = jest.mocked(usePlantActions);
const createPlant = jest.fn();
const onCreated = jest.fn();
const user = userEvent.setup();
const vera = { id: 'p1', name: 'Vera', light: null, wateringEveryDays: null, notes: null, planterId: null };
const planters = [
  { id: 'balcony', name: 'Balcony' },
  { id: 'kitchen', name: 'Kitchen windowsill' },
];

beforeEach(() => {
  mockedUsePlantActions.mockReturnValue({ createPlant });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AddPlantForm', () => {
  it('keeps the button disabled until the plant has a name', async () => {
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Name'), '   ');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    expect(createPlant).not.toHaveBeenCalled();
  });

  it('saves only the name when nothing else is filled in, and hands back the saved plant', async () => {
    createPlant.mockResolvedValue(vera);
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(vera));
    expect(createPlant).toHaveBeenCalledWith({
      name: 'Vera',
      light: null,
      wateringEveryDays: null,
      notes: null,
      planterId: null,
    });
  });

  it('saves the chosen light, watering period and notes', async () => {
    createPlant.mockResolvedValue(vera);
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('radio', { name: 'Bright indirect' }));
    await user.type(screen.getByLabelText('Water every how many days'), '7');
    await user.type(screen.getByLabelText('Notes'), 'Found at a flea market');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() =>
      expect(createPlant).toHaveBeenCalledWith({
        name: 'Vera',
        light: 'bright_indirect',
        wateringEveryDays: 7,
        notes: 'Found at a flea market',
        planterId: null,
      }),
    );
  });

  it('selects one light at a time and clears it when the chosen one is tapped again', async () => {
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.press(screen.getByRole('radio', { name: 'Full sun' }));
    await user.press(screen.getByRole('radio', { name: 'Low light' }));
    expect(screen.getByRole('radio', { name: 'Low light' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Full sun' })).not.toBeChecked();

    await user.press(screen.getByRole('radio', { name: 'Low light' }));
    expect(screen.getByRole('radio', { name: 'Low light' })).not.toBeChecked();
  });

  it('keeps only digits in the watering field', async () => {
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Water every how many days'), '1a2');

    expect(screen.getByLabelText('Water every how many days')).toHaveDisplayValue('12');
  });

  it('shows field-specific validation errors next to the right input', async () => {
    createPlant.mockRejectedValue(
      new ApiError(400, 'Validation failed', {
        fieldErrors: { name: 'Name must be at most 255 characters.', wateringEveryDays: 'Watering must be every 1 to 365 days.' },
      }),
    );
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.type(screen.getByLabelText('Water every how many days'), '0');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    expect(await screen.findByText('Name must be at most 255 characters.')).toBeOnTheScreen();
    expect(screen.getByText('Watering must be every 1 to 365 days.')).toBeOnTheScreen();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("shows the backend's message for other errors", async () => {
    createPlant.mockRejectedValue(new ApiError(500, 'Server error', { detail: 'An unexpected error occurred' }));
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    expect(await screen.findByText('An unexpected error occurred')).toBeOnTheScreen();
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('puts the plant in the chosen planter', async () => {
    createPlant.mockResolvedValue(vera);
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('radio', { name: 'Kitchen windowsill' }));
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

    await waitFor(() => expect(createPlant).toHaveBeenCalledWith(expect.objectContaining({ planterId: 'kitchen' })));
  });

  it('selects one planter at a time and clears it when the chosen one is tapped again', async () => {
    await render(<AddPlantForm planters={planters} plantersError={null} onCreated={onCreated} />);

    await user.press(screen.getByRole('radio', { name: 'Balcony' }));
    await user.press(screen.getByRole('radio', { name: 'Kitchen windowsill' }));
    expect(screen.getByRole('radio', { name: 'Kitchen windowsill' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Balcony' })).not.toBeChecked();
    expect(screen.queryByText('Leave empty to keep it under Other plants.')).toBeNull();

    await user.press(screen.getByRole('radio', { name: 'Kitchen windowsill' }));
    expect(screen.getByRole('radio', { name: 'Kitchen windowsill' })).not.toBeChecked();
    expect(screen.getByText('Leave empty to keep it under Other plants.')).toBeOnTheScreen();
  });

  it('explains where the plant goes when the user has no planters', async () => {
    await render(<AddPlantForm planters={[]} plantersError={null} onCreated={onCreated} />);

    expect(screen.getByText('You have no planters yet, so it goes under Other plants.')).toBeOnTheScreen();
  });

  it('shows why the planters could not be loaded, and still lets the plant be added', async () => {
    createPlant.mockResolvedValue(vera);
    await render(<AddPlantForm planters={null} plantersError="Can't reach myPlunt right now." onCreated={onCreated} />);

    expect(screen.getByText("Can't reach myPlunt right now.")).toBeOnTheScreen();
    await user.type(screen.getByLabelText('Name'), 'Vera');
    await user.press(screen.getByRole('button', { name: 'Add to my garden' }));
    await waitFor(() => expect(createPlant).toHaveBeenCalledWith(expect.objectContaining({ planterId: null })));
  });
});
