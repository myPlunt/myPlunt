import { render, screen, userEvent } from '@testing-library/react-native';

import type { PhotoUpload } from '@/features/photos/use-photo-upload';

import { PhotoField } from '../photo-field';

const user = userEvent.setup();
const takePhoto = jest.fn();
const chooseFromLibrary = jest.fn();
const remove = jest.fn();

function photo(overrides: Partial<PhotoUpload> = {}): PhotoUpload {
  return { uri: null, key: null, isUploading: false, error: null, takePhoto, chooseFromLibrary, remove, ...overrides };
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('PhotoField', () => {
  it('offers the camera and the library when there is no photo yet', async () => {
    await render(<PhotoField photo={photo()} />);

    await user.press(screen.getByRole('button', { name: 'Take photo' }));
    await user.press(screen.getByRole('button', { name: 'Choose from library' }));

    expect(takePhoto).toHaveBeenCalled();
    expect(chooseFromLibrary).toHaveBeenCalled();
  });

  it('shows the picked photo with a spinner while it uploads', async () => {
    await render(<PhotoField photo={photo({ uri: 'file:///a.jpg', isUploading: true })} />);

    expect(screen.getByLabelText('Plant photo')).toBeOnTheScreen();
    expect(screen.getByLabelText('Uploading photo')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Take photo' })).toBeNull();
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
});
