import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
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
  { id: 'monstera', commonName: 'Monstera', scientificName: 'Monstera deliciosa', wateringFrequencyDays: 7, region: null, sunlightNeeds: null, common: false, imageUrl: null },
  { id: 'pothos', commonName: 'Pothos', scientificName: 'Epipremnum aureum', wateringFrequencyDays: 10, region: null, sunlightNeeds: null, common: false, imageUrl: null },
  { id: 'basil', commonName: 'Sweet basil', scientificName: 'Ocimum basilicum', wateringFrequencyDays: null, region: null, sunlightNeeds: null, common: false, imageUrl: null },
];
const planters = [
  { id: 'balcony', name: 'Balcony' },
  { id: 'kitchen', name: 'Kitchen windowsill' },
];

beforeEach(() => {
  mockedUsePlantActions.mockReturnValue({ createPlant, updatePlant, deletePlant: jest.fn() });
  mockedUsePhotoUpload.mockReturnValue(noPhoto);
  jest.mocked(usePlanterActions).mockReturnValue({ createPlanter, renamePlanter: jest.fn(), deletePlanter: jest.fn() });
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

    it('suggests species whose common or scientific name matches the search', async () => {
      await renderForm();

      await user.type(screen.getByLabelText('Species'), 'epiprem');

      expect(screen.getByRole('button', { name: 'Pothos' })).toBeOnTheScreen();
      expect(screen.queryByRole('button', { name: 'Monstera' })).toBeNull();
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
      nextWateringAt: '2026-10-11T08:00:00.000Z',
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
  });
});
