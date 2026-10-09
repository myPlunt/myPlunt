import * as profileService from '@/features/profile/profile-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

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
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/me', { method: 'PUT', body: request });
  });
});

describe('changeEmail', () => {
  it('PUTs the new email and current password to /v1/users/me/email', async () => {
    const updated = { id: 'u1', username: 'jane', email: 'new@example.com', bio: null };
    mockedApiFetch.mockResolvedValue(updated);
    const request = { email: 'new@example.com', currentPassword: 'password123' };

    await expect(profileService.changeEmail(request)).resolves.toEqual(updated);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/me/email', { method: 'PUT', body: request });
  });
});
