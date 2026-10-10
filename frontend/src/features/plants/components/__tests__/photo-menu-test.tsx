import { render, screen, userEvent } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { useRecentPhotos } from '@/features/photos/use-recent-photos';

import { PhotoMenu } from '../photo-menu';

jest.mock('@/features/photos/use-recent-photos');

const mockedUseRecentPhotos = jest.mocked(useRecentPhotos);
const user = userEvent.setup();
const onClose = jest.fn();
const onTakePhoto = jest.fn();
const onSeeAllPhotos = jest.fn();
const onPickRecent = jest.fn();
const photos = [
  { id: 'a1', uri: 'file:///1.jpg', width: 100, height: 100 },
  { id: 'a2', uri: 'file:///2.jpg', width: 100, height: 100 },
];

beforeEach(() => {
  mockedUseRecentPhotos.mockReturnValue({ status: 'ready', photos });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderMenu(props: Partial<ComponentProps<typeof PhotoMenu>> = {}) {
  return render(
    <PhotoMenu
      visible
      onClose={onClose}
      onDismiss={jest.fn()}
      onTakePhoto={onTakePhoto}
      onSeeAllPhotos={onSeeAllPhotos}
      onPickRecent={onPickRecent}
      {...props}
    />,
  );
}

describe('PhotoMenu', () => {
  it('starts with the camera tile, followed by the recent photos', async () => {
    await renderMenu();

    await user.press(screen.getByRole('button', { name: 'Take a photo' }));
    await user.press(screen.getByRole('button', { name: 'Recent photo 2' }));

    expect(onTakePhoto).toHaveBeenCalled();
    expect(onPickRecent).toHaveBeenCalledWith(photos[1]);
    expect(mockedUseRecentPhotos).toHaveBeenCalledWith(true, 5);
  });

  it('opens the system picker for older photos', async () => {
    await renderMenu();

    await user.press(screen.getByRole('button', { name: 'See all photos' }));

    expect(onSeeAllPhotos).toHaveBeenCalled();
  });

  it('shows a spinner while the recent photos load', async () => {
    mockedUseRecentPhotos.mockReturnValue({ status: 'loading' });
    await renderMenu();

    expect(screen.getByLabelText('Loading recent photos')).toBeOnTheScreen();
  });

  it('still offers the camera and the picker without library access, and says how to allow it', async () => {
    mockedUseRecentPhotos.mockReturnValue({ status: 'unavailable' });
    await renderMenu();

    expect(
      screen.getByText('Allow photo access in your phone settings to see your recent photos here.'),
    ).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Take a photo' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'See all photos' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Recent photo 1' })).toBeNull();
  });

  it('closes from Cancel or the dimmed background', async () => {
    await renderMenu();

    await user.press(screen.getByRole('button', { name: 'Cancel' }));
    await user.press(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('loads nothing while it is hidden', async () => {
    await renderMenu({ visible: false });

    expect(mockedUseRecentPhotos).toHaveBeenCalledWith(false, 5);
    expect(screen.queryByRole('button', { name: 'Take a photo' })).toBeNull();
  });
});
