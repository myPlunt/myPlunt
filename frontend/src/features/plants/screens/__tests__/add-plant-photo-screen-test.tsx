import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { usePhotoUpload, type PhotoUpload } from '@/features/photos/use-photo-upload';
import { usePlantActions } from '@/features/plants/use-plant-actions';
import { ApiError } from '@/lib/auth/api-client';

import { AddPlantPhotoScreen } from '../add-plant-photo-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/plants/use-plant-actions');
// The real hook loads the native picker; the photo field's tests cover picking.
jest.mock('@/features/photos/use-photo-upload');

const back = jest.fn();
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
  jest.mocked(useRouter).mockReturnValue({ back, replace, canGoBack } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(usePlantActions).mockReturnValue({
    createPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
    addPlantPhoto,
  });
  addPlantPhoto.mockResolvedValue({ id: 'ph1', url: 'https://storage.test/growth.jpg', takenAt: null, caption: null });
  mockPhoto({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AddPlantPhotoScreen', () => {
  it('adds the uploaded photo with its date and note, then goes back to the plant', async () => {
    await render(<AddPlantPhotoScreen plantId="p1" />);

    await user.type(screen.getByLabelText('Note (optional)'), 'First split leaf!');
    await user.press(screen.getByRole('button', { name: 'Add to timeline' }));

    expect(addPlantPhoto).toHaveBeenCalledWith('p1', {
      photoKey: 'plants/u/growth.jpg',
      takenAt: '2026-08-20T12:00:00.000Z',
      caption: 'First split leaf!',
    });
    expect(back).toHaveBeenCalled();
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
