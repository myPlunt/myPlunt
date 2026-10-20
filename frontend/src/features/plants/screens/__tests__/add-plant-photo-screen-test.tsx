import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { usePhotoUpload, type PhotoUpload } from '@/features/photos/use-photo-upload';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError } from '@/lib/auth/api-client';
import { useOnboardingStore } from '@/stores/onboarding-store';

import { AddPlantPhotoScreen } from '../add-plant-photo-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/stores/onboarding-store', () => ({
  ...jest.requireActual('@/stores/onboarding-store'),
  useOnboardingStore: jest.fn(),
}));
jest.mock('@/features/plants/use-plant-actions');
// The real hook loads the native picker; the photo field's tests cover picking.
jest.mock('@/features/photos/use-photo-upload');

const back = jest.fn();
const dismissTo = jest.fn();
const onboarding = { step: null, start: jest.fn(), next: jest.fn(), skipPast: jest.fn(), finish: jest.fn() };
const replace = jest.fn();
const canGoBack = jest.fn();
const addPlantPhoto = jest.fn();
const user = userEvent.setup();

function mockPhoto(state: Partial<PhotoUpload>) {
  jest.mocked(usePhotoUpload).mockReturnValue({
    uri: 'file:///growth.jpg',
    key: 'plants/u/growth.jpg',
    takenAt: '2026-08-20T12:00:00.000Z',
    isUploading: false,
    error: null,
    takePhoto: jest.fn(),
    chooseFromLibrary: jest.fn(),
    uploadLibraryPhoto: jest.fn(),
    remove: jest.fn(),
    ...state,
  });
}

beforeEach(() => {
  canGoBack.mockReturnValue(true);
  jest.mocked(useOnboardingStore).mockReturnValue(onboarding);
  jest.mocked(useRouter).mockReturnValue({ back, dismissTo, replace, canGoBack } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(usePlantActions).mockReturnValue({
    createPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
    addPlantPhoto,
    updatePlantPhoto: jest.fn(),
    deletePlantPhoto: jest.fn(),
  });
  addPlantPhoto.mockResolvedValue({ id: 'ph1', url: 'https://storage.test/growth.jpg', takenAt: null, caption: null });
  mockPhoto({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AddPlantPhotoScreen', () => {
  it('shares the uploaded photo with its date and a comment, then goes back to the plant', async () => {
    await render(<AddPlantPhotoScreen plantId="p1" />);

    // The comment is for the feed post, so it only appears once sharing is ticked.
    expect(screen.queryByLabelText('Comment (optional)')).toBeNull();
    await user.press(screen.getByRole('checkbox', { name: 'Share this with your friends in the main feed' }));
    await user.type(screen.getByLabelText('Comment (optional)'), 'First split leaf!');
    await user.press(screen.getByRole('button', { name: 'Add to timeline' }));

    expect(addPlantPhoto).toHaveBeenCalledWith('p1', {
      photoKey: 'plants/u/growth.jpg',
      takenAt: '2026-08-20T12:00:00.000Z',
      comment: 'First split leaf!',
      shareToFeed: true,
    });
    expect(back).toHaveBeenCalled();
    expect(onboarding.next).not.toHaveBeenCalled();
  });

  it("during the tour's photo step, saving the photo moves the tour on to watering in the garden", async () => {
    jest.mocked(useOnboardingStore).mockReturnValue({ ...onboarding, step: 'photo' });
    await render(<AddPlantPhotoScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: 'Add to timeline' }));

    expect(onboarding.next).toHaveBeenCalled();
    expect(dismissTo).toHaveBeenCalledWith('/garden');
  });

  it('saves the date the user picked instead of the one from the photo', async () => {
    await render(<AddPlantPhotoScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: /Change the date/ }));
    await user.press(screen.getByRole('button', { name: 'Previous year' }));
    const day = new Date(2025, 7, 5);
    await user.press(
      screen.getByRole('button', {
        name: day.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }),
      }),
    );
    await user.press(screen.getByRole('button', { name: 'Add to timeline' }));

    expect(addPlantPhoto).toHaveBeenCalledWith('p1', {
      photoKey: 'plants/u/growth.jpg',
      takenAt: new Date(2025, 7, 5, 12).toISOString(),
      comment: null,
      shareToFeed: false,
    });
  });

  it("can't be saved until a photo has been uploaded", async () => {
    mockPhoto({ uri: null, key: null, takenAt: null });
    await render(<AddPlantPhotoScreen plantId="p1" />);

    expect(screen.getByRole('button', { name: 'Add to timeline' })).toBeDisabled();
  });

  it('shows why the photo could not be added and stays on the page', async () => {
    addPlantPhoto.mockRejectedValue(
      new ApiError(409, 'Conflict', { detail: "This plant has passed away and can't get new photos" }),
    );
    await render(<AddPlantPhotoScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: 'Add to timeline' }));

    expect(await screen.findByText("This plant has passed away and can't get new photos")).toBeOnTheScreen();
    expect(back).not.toHaveBeenCalled();
  });
});
