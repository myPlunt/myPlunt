import * as profileService from '@/features/profile/profile-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('getCurrentUser', () => {
  it('fetches the signed-in user from /v1/users/me', async () => {
    const user = { id: 'u1', username: 'jane', email: 'jane@example.com' };
    mockedApiFetch.mockResolvedValue(user);

    await expect(profileService.getCurrentUser()).resolves.toEqual(user);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/users/me');
  });
});
