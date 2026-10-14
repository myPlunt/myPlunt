import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as profileService from '@/features/profile/profile-service';
import { useProfileActions } from '@/features/profile/use-profile-actions';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/profile/profile-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedProfileService = jest.mocked(profileService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const request = { username: 'janey', bio: null };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

async function renderWithStore() {
  const rendered = await renderHook(() => ({ actions: useProfileActions(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
  await waitFor(() => expect(rendered.result.current.store.status).toBe('authenticated'));
  return rendered;
}

it('updateProfile returns the updated user from the service', async () => {
  const updated = { id: 'u1', email: 'jane@example.com', ...request };
  mockedProfileService.updateProfile.mockResolvedValue(updated);
  const { result } = await renderWithStore();

  let returned;
  await act(async () => {
    returned = await result.current.actions.updateProfile(request);
  });

  expect(mockedProfileService.updateProfile).toHaveBeenCalledWith(request);
  expect(returned).toEqual(updated);
});

it('changeEmail calls the service and returns the updated user', async () => {
  const updated = { id: 'u1', username: 'jane', email: 'new@example.com', bio: null };
  mockedProfileService.changeEmail.mockResolvedValue(updated);
  const { result } = await renderWithStore();

  let returned;
  await act(async () => {
    returned = await result.current.actions.changeEmail({ email: 'new@example.com', currentPassword: 'pw' });
  });

  expect(mockedProfileService.changeEmail).toHaveBeenCalledWith({ email: 'new@example.com', currentPassword: 'pw' });
  expect(returned).toEqual(updated);
});
