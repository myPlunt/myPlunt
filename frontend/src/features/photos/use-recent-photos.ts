import { AssetField, MediaType, Query, requestPermissionsAsync } from 'expo-media-library';
import { useEffect, useState } from 'react';

import { logError } from '@/lib/logger';

/** A photo from the user's own library, ready to show and to upload. */
export interface LibraryPhoto {
  id: string;
  uri: string;
  width: number;
  height: number;
  /** When the photo was taken (ISO); null when the library doesn't know. */
  takenAt: string | null;
}

export type RecentPhotos =
  | { status: 'loading' }
  // Includes iOS "limited" access: then these are only the photos the user shared with us.
  | { status: 'ready'; photos: LibraryPhoto[] }
  // Refused, or not available (e.g. Expo Go on Android has no full library access).
  | { status: 'unavailable' };

/**
 * The newest photos in the user's library, loaded while `enabled` (the photo menu is
 * open). Asks for library access the first time; the system remembers the answer.
 */
export function useRecentPhotos(enabled: boolean, count: number): RecentPhotos {
  const [state, setState] = useState<RecentPhotos>({ status: 'loading' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function load() {
      setState({ status: 'loading' });
      try {
        // Only photos: on Android 13+ this asks for images, not videos or audio.
        const permission = await requestPermissionsAsync(false, ['photo']);
        if (!permission.granted) {
          if (!cancelled) setState({ status: 'unavailable' });
          return;
        }
        const assets = await new Query()
          .eq(AssetField.MEDIA_TYPE, MediaType.IMAGE)
          .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
          .limit(count)
          .exe();
        const photos = await Promise.all(
          assets.map(async (asset) => {
            const info = await asset.getInfo();
            return {
              id: info.id,
              uri: info.uri,
              width: info.width,
              height: info.height,
              takenAt: info.creationTime === null ? null : new Date(Math.min(info.creationTime, Date.now())).toISOString(),
            };
          }),
        );
        if (!cancelled) setState({ status: 'ready', photos });
      } catch (err) {
        logError('recent_photos_load_failed', err);
        if (!cancelled) setState({ status: 'unavailable' });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, count]);

  return state;
}
