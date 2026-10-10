import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError } from '@/lib/auth/api-client';

import { AddPlantForm } from '../add-plant-form';

jest.mock('@/features/plants/use-plant-actions');

const mockedUsePlantActions = jest.mocked(usePlantActions);
const createPlant = jest.fn();
const onCreated = jest.fn();
const user = userEvent.setup();
const vera = {
  id: 'p1',
  name: 'Vera',
  light: null,
  wateringEveryDays: null,
  notes: null,
  planterId: null,
  speciesId: null,
};
const species = [
  { id: 'monstera', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7 },
  { id: 'pothos', commonName: 'Pothos', scientificName: 'Epipremnum aureum', wateringFrequencyDays: 10 },
  { id: 'basil', commonName: 'Sweet basil', scientificName: 'Ocimum basilicum', wateringFrequencyDays: null },
];
const planters = [
  { id: 'balcony', name: 'Balcony' },
  { id: 'kitchen', name: 'Kitchen windowsill' },
];

beforeEach(() => {
  mockedUsePlantActions.mockReturnValue({ createPlant });
  createPlant.mockResolvedValue(vera);
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderForm(props: Partial<ComponentProps<typeof AddPlantForm>> = {}) {
  return render(
    <AddPlantForm
      species={species}
      speciesError={null}
      planters={planters}
      plantersError={null}
      onCreated={onCreated}
      {...props}
    />,
  );
}

/** Fills in step 1 with just a name and moves on to step 2. */
async function nameAndContinue(name = 'Vera') {
  await user.type(screen.getByLabelText('Name'), name);
  await user.press(screen.getByRole('button', { name: 'Next' }));
}

describe('AddPlantForm', () => {
  describe('step 1: who the plant is', () => {
    it('asks for name, species and photo, and leaves the care details for step 2', async () => {
      await renderForm();

      expect(screen.getByLabelText('Name')).toBeOnTheScreen();
      expect(screen.getByLabelText('Species')).toBeOnTheScreen();
      expect(screen.getByText('Photos are coming soon')).toBeOnTheScreen();
      expect(screen.queryByRole('radio', { name: 'Full sun' })).toBeNull();
      expect(screen.queryByLabelText('Notes')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Add to my garden' })).toBeNull();
    });

    it('keeps Next disabled until the plant has a name', async () => {
      await renderForm();

      await user.type(screen.getByLabelText('Name'), '   ');
      await user.press(screen.getByRole('button', { name: 'Next' }));

      expect(screen.getByLabelText('Name')).toBeOnTheScreen();
      expect(screen.queryByLabelText('Notes')).toBeNull();
    });

    it('suggests species whose common or scientific name matches the search', async () => {
      await renderForm();

      await user.type(screen.getByLabelText('Species'), 'epiprem');

      expect(screen.getByRole('button', { name: 'Pothos' })).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: 'Monstera' })).toBeNull();
    });

    it('says so when no species matches the search', async () => {
      await renderForm();

      await user.type(screen.getByLabelText('Species'), 'cactus');

      expect(screen.getByText('No species matches. You can leave it empty.')).toBeOnTheScreen();
    });

    it('shows why the species could not be loaded', async () => {
      await renderForm({ species: null, speciesError: "Can't reach myPlunt right now." });

      expect(screen.getByText("Can't reach myPlunt right now.")).toBeOnTheScreen();
    });
  });

  describe('step 2: how the plant lives', () => {
    it('shows light, watering, notes and planter once Next is pressed', async () => {
      await renderForm();

      await nameAndContinue();

      expect(screen.getByRole('radio', { name: 'Full sun' })).toBeOnTheScreen();
      expect(screen.getByLabelText('Water every how many days')).toBeOnTheScreen();
      expect(screen.getByLabelText('Notes')).toBeOnTheScreen();
      expect(screen.getByRole('radio', { name: 'Balcony' })).toBeOnTheScreen();
      expect(screen.queryByLabelText('Name')).toBeNull();
    });

    it('goes back to step 1 with what was entered still filled in', async () => {
      await renderForm();
      await nameAndContinue('Vera');

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(screen.getByLabelText('Name')).toHaveDisplayValue('Vera');
    });

    it('selects one light at a time and clears it when the chosen one is tapped again', async () => {
      await renderForm();
      await nameAndContinue();

      await user.press(screen.getByRole('radio', { name: 'Full sun' }));
      await user.press(screen.getByRole('radio', { name: 'Low light' }));
      expect(screen.getByRole('radio', { name: 'Low light' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'Full sun' })).not.toBeChecked();

      await user.press(screen.getByRole('radio', { name: 'Low light' }));
      expect(screen.getByRole('radio', { name: 'Low light' })).not.toBeChecked();
    });

    it('keeps only digits in the watering field', async () => {
      await renderForm();
      await nameAndContinue();

      await user.type(screen.getByLabelText('Water every how many days'), '1a2');

      expect(screen.getByLabelText('Water every how many days')).toHaveDisplayValue('12');
    });

    it('selects one planter at a time and clears it when the chosen one is tapped again', async () => {
      await renderForm();
      await nameAndContinue();

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
      await renderForm({ planters: [] });
      await nameAndContinue();

      expect(screen.getByText('You have no planters yet, so it goes under Other plants.')).toBeOnTheScreen();
    });
  });

  describe('saving', () => {
    it('saves only the name when nothing else is filled in, and hands back the saved plant', async () => {
      await renderForm();
      await nameAndContinue('Vera');

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      await waitFor(() => expect(onCreated).toHaveBeenCalledWith(vera));
      expect(createPlant).toHaveBeenCalledWith({
        name: 'Vera',
        light: null,
        wateringEveryDays: null,
        notes: null,
        planterId: null,
        speciesId: null,
      });
    });

    it('saves everything from both steps', async () => {
      await renderForm();
      await user.type(screen.getByLabelText('Name'), 'Vera');
      await user.type(screen.getByLabelText('Species'), 'mons');
      await user.press(screen.getByRole('button', { name: 'Monstera' }));
      await user.press(screen.getByRole('button', { name: 'Next' }));
      await user.press(screen.getByRole('radio', { name: 'Bright indirect' }));
      await user.type(screen.getByLabelText('Water every how many days'), '9');
      await user.type(screen.getByLabelText('Notes'), 'Found at a flea market');
      await user.press(screen.getByRole('radio', { name: 'Kitchen windowsill' }));

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      await waitFor(() =>
        expect(createPlant).toHaveBeenCalledWith({
          name: 'Vera',
          light: 'bright_indirect',
          wateringEveryDays: 9,
          notes: 'Found at a flea market',
          planterId: 'kitchen',
          speciesId: 'monstera',
        }),
      );
    });

    it('links the picked species, shows its details and hints its watering frequency on step 2', async () => {
      await renderForm();
      await user.type(screen.getByLabelText('Name'), 'Vera');
      await user.type(screen.getByLabelText('Species'), 'mons');
      await user.press(screen.getByRole('button', { name: 'Monstera' }));

      expect(screen.getByLabelText('Species')).toHaveDisplayValue('Monstera');
      expect(screen.getByText(/Monstera deliciosa · usually watered every 7 days/)).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: 'Monstera' })).toBeNull();

      await user.press(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByLabelText('Water every how many days')).toHaveProp('placeholder', '7');
    });

    it('drops the picked species when the search is edited again', async () => {
      await renderForm();
      await user.type(screen.getByLabelText('Name'), 'Vera');
      await user.type(screen.getByLabelText('Species'), 'pot');
      await user.press(screen.getByRole('button', { name: 'Pothos' }));
      await user.type(screen.getByLabelText('Species'), 'x');
      await user.press(screen.getByRole('button', { name: 'Next' }));

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      await waitFor(() => expect(createPlant).toHaveBeenCalledWith(expect.objectContaining({ speciesId: null })));
    });

    it('shows a step 2 validation error next to its input', async () => {
      createPlant.mockRejectedValue(
        new ApiError(400, 'Validation failed', {
          fieldErrors: { wateringEveryDays: 'Watering must be every 1 to 365 days.' },
        }),
      );
      await renderForm();
      await nameAndContinue();
      await user.type(screen.getByLabelText('Water every how many days'), '0');

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      expect(await screen.findByText('Watering must be every 1 to 365 days.')).toBeOnTheScreen();
      expect(screen.getByLabelText('Notes')).toBeOnTheScreen();
      expect(onCreated).not.toHaveBeenCalled();
    });

    it('goes back to step 1 when the backend rejects something entered there', async () => {
      createPlant.mockRejectedValue(
        new ApiError(400, 'Validation failed', { fieldErrors: { name: 'Name must be at most 255 characters.' } }),
      );
      await renderForm();
      await nameAndContinue();

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      expect(await screen.findByText('Name must be at most 255 characters.')).toBeOnTheScreen();
      expect(screen.getByLabelText('Name')).toBeOnTheScreen();
    });

    it("shows the backend's message for other errors", async () => {
      createPlant.mockRejectedValue(new ApiError(500, 'Server error', { detail: 'An unexpected error occurred' }));
      await renderForm();
      await nameAndContinue();

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      expect(await screen.findByText('An unexpected error occurred')).toBeOnTheScreen();
      expect(onCreated).not.toHaveBeenCalled();
    });

    it('still lets the plant be added when the planters could not be loaded', async () => {
      await renderForm({ planters: null, plantersError: "Can't reach myPlunt right now." });
      await nameAndContinue();

      expect(screen.getByText("Can't reach myPlunt right now.")).toBeOnTheScreen();
      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));
      await waitFor(() => expect(createPlant).toHaveBeenCalledWith(expect.objectContaining({ planterId: null })));
    });
  });
});
