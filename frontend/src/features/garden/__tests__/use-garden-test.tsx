import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as gardenService from '@/features/garden/garden-service';
import { useGarden } from '@/features/garden/use-garden';
import { queueWaterings } from '@/features/garden/watering-outbox';
import { ApiError } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import type { GardenPlant } from '@/lib/garden/types';
import { AuthStoreProvider, useAuthStore } from '@/stores/auth-store';

jest.mock('@/features/garden/garden-service');
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

it('sends queued waterings before loading the garden, so it comes back with them', async () => {
  await queueWaterings([{ id: 'p1', name: 'Pinky' }]);
  const calls: string[] = [];
  mockedGardenService.waterPlant.mockImplementation(async () => {
    calls.push('water');
  });
  mockedGardenService.getGarden.mockImplementation(async () => {
    calls.push('garden');
    return garden;
  });
  const { result } = await renderWithStore();

  await waitFor(() => expect(result.current.garden.isLoading).toBe(false));
  expect(calls).toEqual(['water', 'garden']);
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

  it('shows a plant watered offline as watered, waiting to sync', async () => {
    const pinky: GardenPlant = {
      id: 'p1',
      name: 'Pinky',
      speciesId: null,
      speciesName: null,
      wateringFrequencyDays: 3,
      lastWateredAt: null,
      nextWateringAt: '2026-10-01T08:00:00.000Z',
      wateringStreak: 0,
      photoUrl: null,
    };
    mockedGardenService.getGarden.mockResolvedValue({ rooms: [{ id: 'r1', name: 'Balcony', plants: [pinky] }] });
    const visit = await renderWithStore();
    await waitFor(() => expect(visit.result.current.garden.isLoading).toBe(false));
    await visit.unmount();
    mockedGardenService.getGarden.mockRejectedValue(offline);
    mockedGardenService.waterPlant.mockRejectedValue(offline);
    await queueWaterings([pinky]);

    const { result } = await renderWithStore();

    await waitFor(() => expect(result.current.garden.isLoading).toBe(false));
    expect(result.current.garden.garden?.rooms[0].plants[0]).toEqual(
      expect.objectContaining({ lastWateredAt: expect.any(String), waitingToSync: true }),
    );
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
