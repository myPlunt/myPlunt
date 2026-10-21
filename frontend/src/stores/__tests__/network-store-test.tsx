import { act, renderHook } from '@testing-library/react-native';
import { useNetworkState } from 'expo-network';

import { isOfflineState, NetworkStoreProvider, useNetworkStore, useReloadOnReconnect } from '@/stores/network-store';

jest.mock('expo-network', () => ({ useNetworkState: jest.fn() }));

const mockedUseNetworkState = jest.mocked(useNetworkState);
const online = { isConnected: true, isInternetReachable: true };
const offline = { isConnected: false, isInternetReachable: false };

beforeEach(() => {
  mockedUseNetworkState.mockReturnValue(online);
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

function renderStore(reload: () => void = jest.fn()) {
  return renderHook(
    () => {
      useReloadOnReconnect(reload);
      return useNetworkStore();
    },
    { wrapper: NetworkStoreProvider },
  );
}

describe('isOfflineState', () => {
  it('is offline when the phone has no connection, or no internet on it', () => {
    expect(isOfflineState({ isConnected: false, isInternetReachable: false })).toBe(true);
    expect(isOfflineState({ isConnected: true, isInternetReachable: false })).toBe(true);
  });

  it('counts a state that is still being checked as online', () => {
    expect(isOfflineState({})).toBe(false);
    expect(isOfflineState(online)).toBe(false);
  });
});

it('says "Back online" and reloads once the connection comes back, not before', async () => {
  const reload = jest.fn();
  mockedUseNetworkState.mockReturnValue(offline);
  const { result, rerender } = await renderStore(reload);
  expect(result.current.isOffline).toBe(true);
  expect(reload).not.toHaveBeenCalled();

  mockedUseNetworkState.mockReturnValue(online);
  await rerender({});

  expect(result.current.isOffline).toBe(false);
  expect(result.current.notice).toBe('Back online');
  expect(reload).toHaveBeenCalledTimes(1);
});

it('says for a moment what does not work offline', async () => {
  jest.useFakeTimers();
  mockedUseNetworkState.mockReturnValue(offline);
  const { result } = await renderStore();

  await act(() => result.current.explainOffline('Feed'));
  expect(result.current.notice).toBe("Feed doesn't work offline");

  await act(() => jest.advanceTimersByTime(2000));
  expect(result.current.notice).toBeNull();
});
