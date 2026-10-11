import { fireEvent, render, screen, userEvent, waitFor } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { usePhotoUpload, type PhotoUpload } from '@/features/photos/use-photo-upload';
import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError } from '@/lib/auth/api-client';

import { PlantForm } from '../plant-form';

jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/photos/use-photo-upload');
jest.mock('@/features/planters/use-planter-actions');

const mockedUsePlantActions = jest.mocked(usePlantActions);
const mockedUsePhotoUpload = jest.mocked(usePhotoUpload);
const createPlanter = jest.fn();
const noPhoto: PhotoUpload = {
  uri: null,
  key: null,
  isUploading: false,
  error: null,
  takePhoto: jest.fn(),
  chooseFromLibrary: jest.fn(),
  uploadLibraryPhoto: jest.fn(),
  remove: jest.fn(),
};
const createPlant = jest.fn();
const updatePlant = jest.fn();
const onSaved = jest.fn();
const user = userEvent.setup();
const vera = {
  id: 'p1',
  name: 'Vera',
  light: null,
  wateringEveryDays: null,
  notes: null,
  planterId: null,
  speciesId: null,
  photoUrl: null,
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
  mockedUsePlantActions.mockReturnValue({ createPlant, updatePlant });
  mockedUsePhotoUpload.mockReturnValue(noPhoto);
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter });
  createPlant.mockResolvedValue(vera);
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderForm(props: Partial<ComponentProps<typeof PlantForm>> = {}) {
  return render(
    <PlantForm
      species={species}
      speciesError={null}
      planters={planters}
      plantersError={null}
      onSaved={onSaved}
      {...props}
    />,
  );
}

/** Fills in step 1 with just a name and moves on to step 2. */
async function nameAndContinue(name = 'Vera') {
  await user.type(screen.getByLabelText('Name'), name);
  await user.press(screen.getByRole('button', { name: 'Next' }));
}

describe('PlantForm', () => {
  describe('step 1: who the plant is', () => {
    it('asks for name, species and photo, and leaves the care details for step 2', async () => {
      await renderForm();

      expect(screen.getByLabelText('Name')).toBeOnTheScreen();
      expect(screen.getByLabelText('Species')).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Add a photo' })).toBeOnTheScreen();
      expect(screen.queryByRole('radio', { name: 'Full sun' })).toBeNull();
      expect(screen.queryByLabelText('Notes')).toBeNull();
      expect(screen.queryByRole('button', { name: 'Add to my garden' })).toBeNull();
    });

    it('keeps Next disabled while the name is shorter than 3 characters', async () => {
      await renderForm();

      await user.type(screen.getByLabelText('Name'), ' Ve ');
      await user.press(screen.getByRole('button', { name: 'Next' }));
      expect(screen.queryByLabelText('Notes')).toBeNull();

      await user.type(screen.getByLabelText('Name'), 'ra');
      await user.press(screen.getByRole('button', { name: 'Next' }));
      expect(screen.getByLabelText('Notes')).toBeOnTheScreen();
    });

    it('waits until the user leaves the name field before saying it is too short', async () => {
      await renderForm();

      await user.type(screen.getByLabelText('Name'), 'Ve', { skipBlur: true });
      expect(screen.queryByText('Name must be at least 3 characters.')).toBeNull();

      await fireEvent(screen.getByLabelText('Name'), 'blur');
      expect(screen.getByText('Name must be at least 3 characters.')).toBeOnTheScreen();

      // Once shown, it goes away as soon as the name is long enough.
      await user.type(screen.getByLabelText('Name'), 'ra', { skipBlur: true });
      expect(screen.queryByText('Name must be at least 3 characters.')).toBeNull();
    });

    it('says the name is too short when the user leaves it empty', async () => {
      await renderForm();

      await fireEvent(screen.getByLabelText('Name'), 'blur');

      expect(screen.getByText('Name must be at least 3 characters.')).toBeOnTheScreen();
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
      expect(screen.getByRole('button', { name: 'Planter' })).toBeOnTheScreen();
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
      expect(screen.getByRole('radio', { name: 'Low light' }).props.accessibilityHint).toBe('Tap again to clear');

      await user.press(screen.getByRole('radio', { name: 'Low light' }));
      expect(screen.getByRole('radio', { name: 'Low light' })).not.toBeChecked();
    });

    it('keeps only digits in the watering field', async () => {
      await renderForm();
      await nameAndContinue();

      await user.type(screen.getByLabelText('Water every how many days'), '1a2');

      expect(screen.getByLabelText('Water every how many days')).toHaveDisplayValue('12');
    });

    it('picks the planter from a dropdown that starts on Other plants', async () => {
      await renderForm();
      await nameAndContinue();
      expect(screen.getByRole('button', { name: 'Planter' })).toHaveAccessibilityValue({ text: 'Other plants' });

      await user.press(screen.getByRole('button', { name: 'Planter' }));
      await user.press(screen.getByRole('radio', { name: 'Kitchen windowsill' }));

      expect(screen.getByRole('button', { name: 'Planter' })).toHaveAccessibilityValue({ text: 'Kitchen windowsill' });
    });

    it('selects a planter added from the dropdown, even before the garden reloads', async () => {
      createPlanter.mockResolvedValue({ id: 'shed', name: 'Shed' });
      await renderForm({ planters: [] });
      await nameAndContinue();

      await user.press(screen.getByRole('button', { name: 'Planter' }));
      await user.press(screen.getByRole('button', { name: 'Add a planter' }));
      await user.type(screen.getByLabelText('New planter name'), 'Shed');
      await user.press(screen.getByRole('button', { name: 'Add' }));

      expect(await screen.findByRole('button', { name: 'Planter' })).toHaveAccessibilityValue({ text: 'Shed' });
      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));
      await waitFor(() => expect(createPlant).toHaveBeenCalledWith(expect.objectContaining({ planterId: 'shed' })));
    });
  });

  describe('saving', () => {
    it('saves only the name when nothing else is filled in, and hands back the saved plant', async () => {
      await renderForm();
      await nameAndContinue('Vera');

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith(vera));
      expect(createPlant).toHaveBeenCalledWith({
        name: 'Vera',
        light: null,
        wateringEveryDays: null,
        notes: null,
        planterId: null,
        speciesId: null,
        photoKey: null,
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
      await user.press(screen.getByRole('button', { name: 'Planter' }));
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
          photoKey: null,
        }),
      );
    });

    it('sends the key of the uploaded photo with the plant', async () => {
      mockedUsePhotoUpload.mockReturnValue({ ...noPhoto, uri: 'file:///a.jpg', key: 'plants/u1/a.jpg' });
      await renderForm();
      await nameAndContinue();

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      await waitFor(() =>
        expect(createPlant).toHaveBeenCalledWith(expect.objectContaining({ photoKey: 'plants/u1/a.jpg' })),
      );
    });

    it('waits for the photo to finish uploading before the plant can be added', async () => {
      mockedUsePhotoUpload.mockReturnValue({ ...noPhoto, uri: 'file:///a.jpg', isUploading: true });
      await renderForm();
      await nameAndContinue();

      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));

      expect(createPlant).not.toHaveBeenCalled();
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
      expect(onSaved).not.toHaveBeenCalled();
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
      expect(onSaved).not.toHaveBeenCalled();
    });

    it('still lets the plant be added when the planters could not be loaded', async () => {
      await renderForm({ planters: null, plantersError: "Can't reach myPlunt right now." });
      await nameAndContinue();

      expect(screen.getByText("Can't reach myPlunt right now.")).toBeOnTheScreen();
      await user.press(screen.getByRole('button', { name: 'Add to my garden' }));
      await waitFor(() => expect(createPlant).toHaveBeenCalledWith(expect.objectContaining({ planterId: null })));
    });
  });

  describe('editing a plant', () => {
    const veraDetails = {
      ...vera,
      light: 'low_light' as const,
      wateringEveryDays: 9,
      notes: 'Found at a flea market',
      planterId: 'kitchen',
      planterName: 'Kitchen windowsill',
      speciesId: 'monstera',
      speciesName: 'Monstera',
      wateringFrequencyDays: 9,
      lastWateredAt: null,
      nextWateringAt: null,
      photoUrl: 'https://storage.test/vera.jpg',
    };

    it("fills both steps with the plant's current values and shows its photo", async () => {
      await renderForm({ plant: veraDetails });

      expect(screen.getByLabelText('Name')).toHaveDisplayValue('Vera');
      expect(screen.getByLabelText('Species')).toHaveDisplayValue('Monstera');
      expect(screen.getByText(/Monstera deliciosa/)).toBeOnTheScreen();
      expect(screen.getByRole('button', { name: 'Change photo' })).toBeOnTheScreen();

      await user.press(screen.getByRole('button', { name: 'Next' }));

      expect(screen.getByRole('radio', { name: 'Low light' })).toBeChecked();
      expect(screen.getByLabelText('Water every how many days')).toHaveDisplayValue('9');
      expect(screen.getByLabelText('Notes')).toHaveDisplayValue('Found at a flea market');
      expect(screen.getByRole('button', { name: 'Planter' })).toHaveAccessibilityValue({ text: 'Kitchen windowsill' });
    });

    it('asks for a longer name when the plant was saved before names needed 3 characters', async () => {
      await renderForm({ plant: { ...veraDetails, name: 'A' } });

      await user.press(screen.getByRole('button', { name: 'Next' }));
      expect(screen.queryByLabelText('Notes')).toBeNull();

      await fireEvent(screen.getByLabelText('Name'), 'blur');
      expect(screen.getByText('Name must be at least 3 characters.')).toBeOnTheScreen();
    });

    it('saves the changes to the plant instead of adding a new one, keeping the photo', async () => {
      updatePlant.mockResolvedValue({ ...veraDetails, name: 'Vera II' });
      await renderForm({ plant: veraDetails });
      await user.clear(screen.getByLabelText('Name'));
      await user.type(screen.getByLabelText('Name'), 'Vera II');
      await user.press(screen.getByRole('button', { name: 'Next' }));
      await user.press(screen.getByRole('radio', { name: 'Low light' }));

      await user.press(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ ...veraDetails, name: 'Vera II' }));
      expect(updatePlant).toHaveBeenCalledWith('p1', {
        name: 'Vera II',
        light: null,
        wateringEveryDays: 9,
        notes: 'Found at a flea market',
        planterId: 'kitchen',
        speciesId: 'monstera',
        photoKey: null,
      });
      expect(createPlant).not.toHaveBeenCalled();
    });

    it('sends the key of a newly picked photo', async () => {
      mockedUsePhotoUpload.mockReturnValue({ ...noPhoto, uri: 'file:///b.jpg', key: 'plants/u1/b.jpg' });
      updatePlant.mockResolvedValue(veraDetails);
      await renderForm({ plant: veraDetails });
      await user.press(screen.getByRole('button', { name: 'Next' }));

      await user.press(screen.getByRole('button', { name: 'Save changes' }));

      await waitFor(() =>
        expect(updatePlant).toHaveBeenCalledWith('p1', expect.objectContaining({ photoKey: 'plants/u1/b.jpg' })),
      );
    });

    it('shows why the changes could not be saved', async () => {
      updatePlant.mockRejectedValue(new ApiError(409, 'Conflict', { detail: "This plant has passed away and can't be edited" }));
      await renderForm({ plant: veraDetails });
      await user.press(screen.getByRole('button', { name: 'Next' }));

      await user.press(screen.getByRole('button', { name: 'Save changes' }));

      expect(await screen.findByText("This plant has passed away and can't be edited")).toBeOnTheScreen();
      expect(onSaved).not.toHaveBeenCalled();
    });
  });
});
