import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as gardenService from '@/features/garden/garden-service';
import { useGarden } from '@/features/garden/use-garden';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/garden/garden-service');
// No navigator in this test: treat "focused" as "mounted".
jest.mock('expo-router', () => {
  const { useEffect } = jest.requireActual('react');
  return { useFocusEffect: (effect: () => void | (() => void)) => useEffect(effect, [effect]) };
});
jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: { getTokens: jest.fn() },
}));

const mockedGardenService = jest.mocked(gardenService);
const mockedTokenStorage = jest.mocked(tokenStorage);
const garden = { rooms: [{ id: 'r1', name: 'Balcony', plants: [] }] };

beforeEach(() => {
  mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
});

afterEach(() => {
  jest.resetAllMocks();
});

function renderWithStore() {
  return renderHook(() => ({ garden: useGarden(), store: useAuthStore() }), {
    wrapper: AuthStoreProvider,
  });
}

// Loads the garden once, as on an earlier visit, which saves a copy of it on the device.
async function visitGarden() {
  mockedGardenService.getGarden.mockResolvedValue(garden);
  const { result, unmount } = await renderWithStore();
  await waitFor(() => expect(result.current.garden.garden).toEqual(garden));
  await unmount();
}

it('loads the garden', async () => {
  mockedGardenService.getGarden.mockResolvedValue(garden);
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.garden.isLoading).toBe(false));
  expect(result.current.garden.garden).toEqual(garden);
  expect(result.current.garden.error).toBeNull();
});

it("loads a friend's garden when given their id", async () => {
  mockedGardenService.getGarden.mockResolvedValue(garden);
  const { result } = await renderHook(() => useGarden('u2'), { wrapper: AuthStoreProvider });

  await waitFor(() => expect(result.current.garden).toEqual(garden));
  expect(mockedGardenService.getGarden).toHaveBeenCalledWith('u2');
});

it('signs the user out when the session has expired', async () => {
  mockedGardenService.getGarden.mockRejectedValue(new ApiError(401, 'Not authenticated'));
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.store.status).toBe('unauthenticated'));
  expect(result.current.garden.error).toBeNull();
});

describe('without a connection', () => {
  const offline = new ApiError(0, 'Network request failed', {
    detail: "Can't reach myPlunt right now. Check your connection and try again.",
  });

  it('shows the garden saved on the last visit', async () => {
    await visitGarden();
    mockedGardenService.getGarden.mockRejectedValue(offline);
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.garden.isLoading).toBe(false));
    expect(result.current.garden.garden).toEqual(garden);
    expect(result.current.garden.error).toBeNull();
  });

  it('shows the error when no garden was saved yet', async () => {
    mockedGardenService.getGarden.mockRejectedValue(offline);
    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.garden.isLoading).toBe(false));
    expect(result.current.garden.garden).toBeNull();
    expect(result.current.garden.error).toBe(offline.detail);
  });
});

it('waits for the server, even with a garden saved', async () => {
  await visitGarden();
  mockedGardenService.getGarden.mockReturnValue(new Promise(() => {}));
  const { result } = await renderWithStore();

  // The saved copy's photo links may have expired, so it only shows once there's no answer.
  await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
  expect(result.current.garden.isLoading).toBe(true);
  expect(result.current.garden.garden).toBeNull();
});
