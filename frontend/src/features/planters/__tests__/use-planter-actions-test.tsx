import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as planterService from '@/features/planters/planter-service';
import { usePlanterActions } from '@/features/planters/use-planter-actions';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/planters/planter-service');
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedPlanterService = jest.mocked(planterService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const request = { name: 'Balcony' };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

async function renderWithStore() {
  const rendered = await renderHook(() => ({ actions: usePlanterActions(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
  await waitFor(() => expect(rendered.result.current.store.status).toBe('authenticated'));
  return rendered;
}

it('createPlanter returns the saved planter from the service', async () => {
  const saved = { id: 'p1', ...request };
  mockedPlanterService.createPlanter.mockResolvedValue(saved);
  const { result } = await renderWithStore();

  let returned;
  await act(async () => {
    returned = await result.current.actions.createPlanter(request);
  });

  expect(mockedPlanterService.createPlanter).toHaveBeenCalledWith(request);
  expect(returned).toEqual(saved);
});

it('createPlanter signs the user out and rethrows when the session has expired', async () => {
  mockedPlanterService.createPlanter.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await act(async () => {
    await expect(result.current.actions.createPlanter(request)).rejects.toBeInstanceOf(ApiError);
  });

  expect(result.current.store.status).toBe('unauthenticated');
});

it('createPlanter rethrows other errors without changing the session', async () => {
  mockedPlanterService.createPlanter.mockRejectedValue(new ApiError(400, 'Validation failed'));
  const { result } = await renderWithStore();

  await act(async () => {
    await expect(result.current.actions.createPlanter(request)).rejects.toBeInstanceOf(ApiError);
  });

  expect(result.current.store.status).toBe('authenticated');
});
