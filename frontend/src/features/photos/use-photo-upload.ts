import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useRef, useState } from 'react';

import { describeError } from '@/lib/auth/api-client';
import type { PhotoCategory } from '@/lib/photo/types';

import { uploadPhoto } from './photo-service';
import type { LibraryPhoto } from './use-recent-photos';

// Big enough for a full-width photo on any phone, small enough to stay far below the
// backend's 5 MB limit. Resizing also turns iPhone HEIC photos into JPEG, which the backend accepts.
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.8;

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Lets the user crop to a square, so every plant photo has the same shape.
  allowsEditing: true,
  aspect: [1, 1],
};

export interface PhotoUpload {
  /** Local preview of the picked photo; null when there is none. */
  uri: string | null;
  /** Storage key once the upload finished; null before that or without a photo. */
  key: string | null;
  isUploading: boolean;
  error: string | null;
  takePhoto: () => Promise<void>;
  chooseFromLibrary: () => Promise<void>;
  /** Uploads a photo the user tapped in the recent-photos grid. */
  uploadLibraryPhoto: (photo: LibraryPhoto) => Promise<void>;
  remove: () => void;
}

/** Picks a photo from the camera or the library, crops and shrinks it, and uploads it right away. */
export function usePhotoUpload(category: PhotoCategory): PhotoUpload {
  const [uri, setUri] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Bumped on every pick and remove, so a slow upload can't overwrite a newer choice.
  const attempt = useRef(0);

  async function takePhoto() {
    // The library picker needs no permission on either platform (it runs in the system's
    // own process); the camera does, on both.
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Allow camera access in your phone settings to take a photo.');
      return;
    }
    await handlePicked(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  }

  async function chooseFromLibrary() {
    await handlePicked(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  }

  async function handlePicked(result: ImagePicker.ImagePickerResult) {
    if (result.canceled) return;
    const [asset] = result.assets;
    await uploadLibraryPhoto({ uri: asset.uri, width: asset.width, height: asset.height });
  }

  async function uploadLibraryPhoto(photo: { uri: string; width: number; height: number }) {
    const current = ++attempt.current;
    setUri(photo.uri);
    setKey(null);
    setError(null);
    setIsUploading(true);
    try {
      const uploadedKey = await uploadPhoto(await squareJpeg(photo), category);
      if (current === attempt.current) setKey(uploadedKey);
    } catch (err) {
      if (current === attempt.current) {
        setUri(null);
        setError(describeError(err));
      }
    } finally {
      if (current === attempt.current) setIsUploading(false);
    }
  }

  function remove() {
    attempt.current++;
    setUri(null);
    setKey(null);
    setError(null);
    setIsUploading(false);
  }

  return { uri, key, isUploading, error, takePhoto, chooseFromLibrary, uploadLibraryPhoto, remove };
}

/**
 * Centre-crops the photo to a square (the picker's own crop already is one; photos from
 * the recent grid aren't) and shrinks it to at most MAX_WIDTH, as a JPEG file.
 */
async function squareJpeg({ uri, width, height }: { uri: string; width: number; height: number }) {
  const side = Math.min(width, height);
  const context = ImageManipulator.manipulate(uri);
  if (width !== height) {
    context.crop({ originX: (width - side) / 2, originY: (height - side) / 2, width: side, height: side });
  }
  if (side > MAX_WIDTH) context.resize({ width: MAX_WIDTH });
  const image = await (await context.renderAsync()).saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  return image.uri;
}
