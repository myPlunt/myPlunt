import * as Location from 'expo-location';

import { apiFetch } from '@/lib/auth/api-client';
import { logAction, logWarning } from '@/lib/logger';
import { createRequestId } from '@/lib/request-id';
import type { UpdateLocationRequest } from '@/lib/user/types';

// Two decimals is about 1 km: enough for the city's weather, never the user's street.
function roughly(degrees: number) {
  return Math.round(degrees * 100) / 100;
}

/**
 * Asks for the location once and saves the user's city. Resolves false when permission is
 * denied, and nothing is saved; the system won't ask again, so the tour just moves on.
 */
export async function shareLocation(): Promise<boolean> {
  const { granted } = await Location.requestForegroundPermissionsAsync();
  if (!granted) {
    logWarning('location_permission_denied');
    return false;
  }
  // Low accuracy is all a city needs, and all Android may give (see app.config.js).
  const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
  // Naming the place can fail offline; the coordinates are still worth saving without it.
  const [place] = await Location.reverseGeocodeAsync(coords).catch(() => []);

  const request: UpdateLocationRequest = {
    latitude: roughly(coords.latitude),
    longitude: roughly(coords.longitude),
    city: place?.city ?? place?.subregion ?? null,
  };
  const requestId = createRequestId();
  logAction('location_share_submitted', { requestId });
  await apiFetch<void>('/v1/users/me/location', { method: 'PUT', body: request, requestId });
  return true;
}
