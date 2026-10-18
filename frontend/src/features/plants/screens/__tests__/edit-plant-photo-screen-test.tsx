import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { usePlantActions } from '@/features/plants/use-plant-actions';
import { usePlantPhotos } from '@/features/plants/use-plant-photos';

import { EditPlantPhotoScreen } from '../edit-plant-photo-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/plants/use-plant-photos');

const back = jest.fn();
const canGoBack = jest.fn();
const updatePlantPhoto = jest.fn();
const user = userEvent.setup();

beforeEach(() => {
  canGoBack.mockReturnValue(true);
  jest.mocked(useRouter).mockReturnValue({ back, canGoBack, replace: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(usePlantActions).mockReturnValue({
    createPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
    addPlantPhoto: jest.fn(),
    updatePlantPhoto,
    deletePlantPhoto: jest.fn(),
  });
  jest.mocked(usePlantPhotos).mockReturnValue({
    photos: [{ id: 'jun', url: 'https://storage.test/jun.jpg', takenAt: '2026-06-14T12:00:00.000Z', caption: 'Old note' }],
    error: null,
    isLoading: false,
    retry: jest.fn(),
  });
  updatePlantPhoto.mockResolvedValue({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('EditPlantPhotoScreen', () => {
  it('saves the changed note with the photo date and goes back', async () => {
    await render(<EditPlantPhotoScreen plantId="p1" photoId="jun" />);

    await user.clear(screen.getByLabelText('Note (optional)'));
    await user.type(screen.getByLabelText('Note (optional)'), 'Repotted');
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(updatePlantPhoto).toHaveBeenCalledWith('p1', 'jun', {
      takenAt: '2026-06-14T12:00:00.000Z',
      caption: 'Repotted',
    });
    expect(back).toHaveBeenCalled();
  });

  it('says so when the photo is not there anymore', async () => {
    await render(<EditPlantPhotoScreen plantId="p1" photoId="gone" />);

    expect(screen.getByText('Photo not found')).toBeOnTheScreen();
  });
});
