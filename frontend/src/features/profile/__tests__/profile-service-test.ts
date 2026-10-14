import * as profileService from '@/features/profile/profile-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));
jest.mock('@/lib/time-zone', () => ({ timeZoneQuery: () => '?zone=Europe%2FAmsterdam' }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('getCurrentUser', () => {
  it('fetches the signed-in user from /v1/users/me', async () => {
    const user = { id: 'u1', username: 'jane', email: 'jane@example.com', bio: null };
    mockedApiFetch.mockResolvedValue(user);

    await expect(profileService.getCurrentUser()).resolves.toEqual(user);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/me');
  });
});

describe('updateProfile', () => {
  it('PUTs the username and bio to /v1/users/me and returns the updated user', async () => {
    const updated = { id: 'u1', username: 'janey', email: 'jane@example.com', bio: 'Fern collector' };
    mockedApiFetch.mockResolvedValue(updated);
    const request = { username: 'janey', bio: 'Fern collector' };

    await expect(profileService.updateProfile(request)).resolves.toEqual(updated);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/me', expect.objectContaining({ method: 'PUT', body: request }));
  });
});

describe('changeEmail', () => {
  it('PUTs the new email and current password to /v1/users/me/email', async () => {
    const updated = { id: 'u1', username: 'jane', email: 'new@example.com', bio: null };
    mockedApiFetch.mockResolvedValue(updated);
    const request = { email: 'new@example.com', currentPassword: 'password123' };

    await expect(profileService.changeEmail(request)).resolves.toEqual(updated);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/me/email', expect.objectContaining({ method: 'PUT', body: request }));
  });
});

describe('getWateringStreak', () => {
  it("GETs the user's streak, with the device's time zone", async () => {
    mockedApiFetch.mockResolvedValue({ wateringStreak: 7 });

    await expect(profileService.getWateringStreak()).resolves.toEqual({ wateringStreak: 7 });
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/waterings/streak?zone=Europe%2FAmsterdam');
  });
});

describe('getWaterings', () => {
  it("GETs the user's waterings between the two moments", async () => {
    const waterings = [{ id: 'w1', plantId: 'p1', plantName: 'Vera', wateredAt: '2026-10-07T08:00:00Z' }];
    mockedApiFetch.mockResolvedValue(waterings);

    await expect(
      profileService.getWaterings(new Date('2026-09-30T22:00:00Z'), new Date('2026-10-31T23:00:00Z')),
    ).resolves.toEqual(waterings);
    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/v1/waterings?from=2026-09-30T22%3A00%3A00.000Z&to=2026-10-31T23%3A00%3A00.000Z',
    );
  });
});
