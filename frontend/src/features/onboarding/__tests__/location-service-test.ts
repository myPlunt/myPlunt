import * as Location from 'expo-location';

import { shareLocation } from '@/features/onboarding/location-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('expo-location', () => ({
  Accuracy: { Low: 2 },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  reverseGeocodeAsync: jest.fn(),
}));
jest.mock('@/lib/auth/api-client', () => ({
  ...jest.requireActual('@/lib/auth/api-client'),
  apiFetch: jest.fn(),
}));

const mockedLocation = jest.mocked(Location);
const mockedApiFetch = jest.mocked(apiFetch);

beforeEach(() => {
  mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
  mockedLocation.getCurrentPositionAsync.mockResolvedValue({
    coords: { latitude: 52.21837, longitude: 6.89584 },
  } as Location.LocationObject);
  mockedLocation.reverseGeocodeAsync.mockResolvedValue([{ city: 'Enschede' } as Location.LocationGeocodedAddress]);
  mockedApiFetch.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('shareLocation', () => {
  it('saves the city with coordinates rounded to about a kilometre', async () => {
    await expect(shareLocation()).resolves.toBe(true);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/v1/users/me/location',
      expect.objectContaining({ method: 'PUT', body: { latitude: 52.22, longitude: 6.9, city: 'Enschede' } }),
    );
  });

  it('saves nothing when the user denies permission', async () => {
    mockedLocation.requestForegroundPermissionsAsync.mockResolvedValue({ granted: false } as Location.LocationPermissionResponse);

    await expect(shareLocation()).resolves.toBe(false);

    expect(mockedLocation.getCurrentPositionAsync).not.toHaveBeenCalled();
    expect(mockedApiFetch).not.toHaveBeenCalled();
  });
});
