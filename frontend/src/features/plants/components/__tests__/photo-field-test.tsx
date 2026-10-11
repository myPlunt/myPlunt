import { act, render, screen, userEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import type { TestInstance } from 'test-renderer';

import type { PhotoUpload } from '@/features/photos/use-photo-upload';
import { useRecentPhotos } from '@/features/photos/use-recent-photos';

import { PhotoField } from '../photo-field';

jest.mock('@/features/photos/use-recent-photos');

const user = userEvent.setup();
const uploadLibraryPhoto = jest.fn();
const fern = { id: 'a1', uri: 'file:///fern.jpg', width: 3000, height: 4000 };
const takePhoto = jest.fn();
const chooseFromLibrary = jest.fn();
const remove = jest.fn();

/** The menu Modal's onDismiss, found by walking up from an element inside it. */
function modalOnDismiss(element: TestInstance): () => void {
  let current: TestInstance | null = element;
  while (current && !current.props.onDismiss) current = current.parent;
  if (!current) throw new Error('No Modal around this element');
  return current.props.onDismiss;
}

function photo(overrides: Partial<PhotoUpload> = {}): PhotoUpload {
  return {
    uri: null,
    key: null,
    isUploading: false,
    error: null,
    takePhoto,
    chooseFromLibrary,
    uploadLibraryPhoto,
    remove,
    ...overrides,
  };
}

beforeEach(() => {
  jest.mocked(useRecentPhotos).mockReturnValue({ status: 'ready', photos: [fern] });
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe('PhotoField', () => {
  it('opens the photo menu when the empty box is tapped', async () => {
    await render(<PhotoField photo={photo()} />);
    expect(screen.queryByRole('button', { name: 'Take a photo' })).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Add a photo' }));

    expect(screen.getByRole('button', { name: 'Take a photo' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'See all photos' })).toBeOnTheScreen();
  });

  it('closes the menu and uploads a recent photo as soon as it is tapped', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    await render(<PhotoField photo={photo()} />);
    await user.press(screen.getByRole('button', { name: 'Add a photo' }));

    await user.press(screen.getByRole('button', { name: 'Recent photo 1' }));

    expect(uploadLibraryPhoto).toHaveBeenCalledWith(fern);
    expect(screen.queryByRole('button', { name: 'Take a photo' })).toBeNull();
  });

  it('closes the menu without picking anything when cancelled', async () => {
    await render(<PhotoField photo={photo()} />);
    await user.press(screen.getByRole('button', { name: 'Add a photo' }));

    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('button', { name: 'Take a photo' })).toBeNull();
    expect(takePhoto).not.toHaveBeenCalled();
    expect(chooseFromLibrary).not.toHaveBeenCalled();
  });

  it('on iOS, opens the camera once the menu has finished closing', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    await render(<PhotoField photo={photo()} />);
    await user.press(screen.getByRole('button', { name: 'Add a photo' }));
    // Kept from while it was open: a hidden Modal renders nothing in Jest.
    const onDismiss = modalOnDismiss(screen.getByRole('button', { name: 'Cancel' }));

    await user.press(screen.getByRole('button', { name: 'Take a photo' }));
    expect(screen.queryByRole('button', { name: 'Take a photo' })).toBeNull();
    expect(takePhoto).not.toHaveBeenCalled();
    await act(async () => onDismiss());

    expect(takePhoto).toHaveBeenCalled();
    expect(chooseFromLibrary).not.toHaveBeenCalled();
  });

  it('on Android, opens the system picker right away', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await render(<PhotoField photo={photo()} />);
    await user.press(screen.getByRole('button', { name: 'Add a photo' }));

    await user.press(screen.getByRole('button', { name: 'See all photos' }));

    expect(chooseFromLibrary).toHaveBeenCalled();
    expect(takePhoto).not.toHaveBeenCalled();
  });

  it('shows the picked photo with a spinner while it uploads', async () => {
    await render(<PhotoField photo={photo({ uri: 'file:///a.jpg', isUploading: true })} />);

    expect(screen.getByLabelText('Plant photo')).toBeOnTheScreen();
    expect(screen.getByLabelText('Uploading photo')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Add a photo' })).toBeNull();
  });

  it('lets the user remove an uploaded photo', async () => {
    await render(<PhotoField photo={photo({ uri: 'file:///a.jpg', key: 'plants/u1/a.jpg' })} />);

    expect(screen.queryByLabelText('Uploading photo')).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Remove photo' }));

    expect(remove).toHaveBeenCalled();
  });

  it('shows why the photo could not be added', async () => {
    await render(<PhotoField photo={photo({ error: "Couldn't upload the photo. Please try again." })} />);

    expect(screen.getByText("Couldn't upload the photo. Please try again.")).toBeOnTheScreen();
  });

  it("shows the plant's current photo and opens the menu to replace it", async () => {
    await render(<PhotoField photo={photo()} currentPhotoUrl="https://storage.test/vera.jpg" />);

    expect(screen.getByLabelText('Plant photo')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Remove photo' })).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Change photo' }));

    expect(screen.getByRole('button', { name: 'Take a photo' })).toBeOnTheScreen();
  });

  it('shows a newly picked photo instead of the current one', async () => {
    await render(
      <PhotoField photo={photo({ uri: 'file:///a.jpg', key: 'plants/u1/a.jpg' })} currentPhotoUrl="https://storage.test/vera.jpg" />,
    );

    // Removing undoes the new pick (the current photo comes back), so it's offered only for the new one.
    expect(screen.getByRole('button', { name: 'Remove photo' })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Change photo' })).toBeNull();
  });
});
