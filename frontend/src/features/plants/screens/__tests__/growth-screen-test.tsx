import { render, screen, userEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';

import { usePlantActions } from '@/features/plants/use-plant-actions';
import { usePlantPhotos } from '@/features/plants/use-plant-photos';
import { ApiError } from '@/lib/auth/api-client';
import type { PlantPhoto } from '@/lib/plant/types';

import { GrowthScreen } from '../growth-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/plants/use-plant-actions');
jest.mock('@/features/plants/use-plant-photos');

const push = jest.fn();
const deletePlantPhoto = jest.fn();
const user = userEvent.setup();
const photos: PlantPhoto[] = [
  { id: 'jan', url: 'https://storage.test/jan.jpg', takenAt: '2026-01-12T12:00:00Z', caption: 'Just brought her home' },
  { id: 'jun', url: 'https://storage.test/jun.jpg', takenAt: '2026-06-14T12:00:00Z', caption: 'First split leaf!' },
];
const junLabel = new Date('2026-06-14T12:00:00Z').toLocaleDateString(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

beforeEach(() => {
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  jest.mocked(usePlantActions).mockReturnValue({
    createPlant: jest.fn(),
    updatePlant: jest.fn(),
    deletePlant: jest.fn(),
    addPlantPhoto: jest.fn(),
    updatePlantPhoto: jest.fn(),
    deletePlantPhoto,
  });
  jest.mocked(usePlantPhotos).mockReturnValue({ photos, error: null, isLoading: false, retry: jest.fn() });
  deletePlantPhoto.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('GrowthScreen', () => {
  it('shows the photos newest first with the time between them', async () => {
    await render(<GrowthScreen plantId="p1" />);

    expect(screen.getByText('2 photos since Jan 2026')).toBeOnTheScreen();
    expect(screen.getByText('5 months later')).toBeOnTheScreen();
    expect(screen.getByText('First split leaf!')).toBeOnTheScreen();
  });

  it('deletes a photo after confirming and takes it off the timeline', async () => {
    await render(<GrowthScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: `Delete photo from ${junLabel}` }));
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(deletePlantPhoto).toHaveBeenCalledWith('p1', 'jun');
    expect(screen.queryByText('First split leaf!')).toBeNull();
    expect(screen.getByText('Just brought her home')).toBeOnTheScreen();
  });

  it('keeps the photo and shows why when it could not be deleted', async () => {
    deletePlantPhoto.mockRejectedValue(new ApiError(404, 'Not Found', { detail: 'Photo not found' }));
    await render(<GrowthScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: `Delete photo from ${junLabel}` }));
    await user.press(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Photo not found')).toBeOnTheScreen();
    expect(screen.getByText('First split leaf!')).toBeOnTheScreen();
  });

  it('opens the edit screen for a photo', async () => {
    await render(<GrowthScreen plantId="p1" />);

    await user.press(screen.getByRole('button', { name: `Edit photo from ${junLabel}` }));

    expect(push).toHaveBeenCalledWith({ pathname: '/plant/[id]/photo/[photoId]', params: { id: 'p1', photoId: 'jun' } });
  });
});
