import { act, renderHook } from '@testing-library/react-native';
import { ImageManipulator } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { uploadPhoto } from '@/features/photos/photo-service';
import { usePhotoUpload } from '@/features/photos/use-photo-upload';
import { ApiError } from '@/lib/auth/api-client';

jest.mock('@/features/photos/photo-service');
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));
jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg' },
}));

const mockedPicker = jest.mocked(ImagePicker);
const mockedUploadPhoto = jest.mocked(uploadPhoto);
const resize = jest.fn();
const crop = jest.fn();
const saveAsync = jest.fn();

function picked(width = 4000): ImagePicker.ImagePickerResult {
  return {
    canceled: false,
    assets: [{ uri: 'file:///picked.heic', width, height: width } as ImagePicker.ImagePickerAsset],
  };
}

beforeEach(() => {
  jest.mocked(ImageManipulator.manipulate).mockReturnValue({
    resize,
    crop,
    renderAsync: () => Promise.resolve({ saveAsync }),
  } as unknown as ReturnType<typeof ImageManipulator.manipulate>);
  saveAsync.mockResolvedValue({ uri: 'file:///small.jpg', width: 1600, height: 1600 });
  mockedPicker.requestCameraPermissionsAsync.mockResolvedValue({
    granted: true,
  } as ImagePicker.CameraPermissionResponse);
  mockedPicker.launchCameraAsync.mockResolvedValue(picked());
  mockedPicker.launchImageLibraryAsync.mockResolvedValue(picked());
  mockedUploadPhoto.mockResolvedValue('plants/u1/a.jpg');
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('usePhotoUpload', () => {
  it('shrinks a picked photo to a JPEG, uploads it and keeps its key', async () => {
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    await act(() => result.current.chooseFromLibrary());

    expect(resize).toHaveBeenCalledWith({ width: 1600 });
    expect(saveAsync).toHaveBeenCalledWith({ format: 'jpeg', compress: 0.8 });
    expect(mockedUploadPhoto).toHaveBeenCalledWith('file:///small.jpg', 'PLANT');
    expect(result.current).toEqual(
      expect.objectContaining({ uri: 'file:///picked.heic', key: 'plants/u1/a.jpg', isUploading: false, error: null }),
    );
  });

  it('centre-crops a tapped recent photo to a square before uploading it', async () => {
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    await act(() => result.current.uploadLibraryPhoto({ id: 't1', uri: 'file:///tall.jpg', width: 1000, height: 1600 }));

    expect(crop).toHaveBeenCalledWith({ originX: 0, originY: 300, width: 1000, height: 1000 });
    expect(resize).not.toHaveBeenCalled();
    expect(mockedUploadPhoto).toHaveBeenCalledWith('file:///small.jpg', 'PLANT');
    expect(result.current.uri).toBe('file:///tall.jpg');
    expect(result.current.key).toBe('plants/u1/a.jpg');
  });

  it('leaves photos that are already small at their size', async () => {
    mockedPicker.launchImageLibraryAsync.mockResolvedValue(picked(1200));
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    await act(() => result.current.chooseFromLibrary());

    expect(resize).not.toHaveBeenCalled();
    expect(crop).not.toHaveBeenCalled();
    expect(mockedUploadPhoto).toHaveBeenCalled();
  });

  it('takes a photo with the camera once the user allows it', async () => {
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    await act(() => result.current.takePhoto());

    expect(mockedPicker.launchCameraAsync).toHaveBeenCalled();
    expect(result.current.key).toBe('plants/u1/a.jpg');
  });

  it('explains how to allow the camera when permission is denied', async () => {
    mockedPicker.requestCameraPermissionsAsync.mockResolvedValue({
      granted: false,
    } as ImagePicker.CameraPermissionResponse);
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    await act(() => result.current.takePhoto());

    expect(mockedPicker.launchCameraAsync).not.toHaveBeenCalled();
    expect(result.current.error).toBe('Allow camera access in your phone settings to take a photo.');
  });

  it('does nothing when the user cancels the picker', async () => {
    mockedPicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: null });
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    await act(() => result.current.chooseFromLibrary());

    expect(mockedUploadPhoto).not.toHaveBeenCalled();
    expect(result.current.uri).toBeNull();
  });

  it('drops the photo and shows why when the upload fails', async () => {
    const error = new ApiError(0, 'Photo upload failed', { detail: "Couldn't upload the photo. Please try again." });
    mockedUploadPhoto.mockRejectedValue(error);
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    await act(() => result.current.chooseFromLibrary());

    expect(result.current).toEqual(
      expect.objectContaining({
        uri: null,
        key: null,
        isUploading: false,
        error: "Couldn't upload the photo. Please try again.",
      }),
    );
  });

  it('forgets the photo when it is removed', async () => {
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));
    await act(() => result.current.chooseFromLibrary());

    await act(async () => result.current.remove());

    expect(result.current).toEqual(expect.objectContaining({ uri: null, key: null, isUploading: false }));
  });

  it('ignores an upload that finishes after the photo was removed', async () => {
    let finishUpload: (key: string) => void = () => {};
    mockedUploadPhoto.mockReturnValue(new Promise((resolve) => (finishUpload = resolve)));
    const { result } = await renderHook(() => usePhotoUpload('PLANT'));

    let picking: Promise<void> = Promise.resolve();
    await act(async () => {
      picking = result.current.chooseFromLibrary();
    });
    expect(result.current.isUploading).toBe(true);
    await act(async () => result.current.remove());
    await act(async () => {
      finishUpload('plants/u1/late.jpg');
      await picking;
    });

    expect(result.current.key).toBeNull();
  });
});
