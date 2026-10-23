import { act, renderHook } from '@testing-library/react-native';
import { useNetworkState } from 'expo-network';

import { checkServer, onReachabilityChange } from '@/lib/auth/api-client';
import { isOfflineState, NetworkStoreProvider, useNetworkStore, useReloadOnReconnect } from '@/stores/network-store';

jest.mock('expo-network', () => ({ useNetworkState: jest.fn() }));
jest.mock('@/lib/auth/api-client', () => ({ checkServer: jest.fn(), onReachabilityChange: jest.fn() }));

const mockedUseNetworkState = jest.mocked(useNetworkState);
const mockedCheckServer = jest.mocked(checkServer);
const online = { isConnected: true, isInternetReachable: true };
const offline = { isConnected: false, isInternetReachable: false };
let reachabilityListener: (reachable: boolean) => void;

beforeEach(() => {
  jest.useFakeTimers();
  mockedUseNetworkState.mockReturnValue(online);
  mockedCheckServer.mockResolvedValue(false);
  jest.mocked(onReachabilityChange).mockImplementation((listener) => {
    reachabilityListener = listener;
    return () => {};
  });
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

function serverAnswers(reachable: boolean) {
  return act(() => reachabilityListener(reachable));
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

it("goes offline only once the server stops answering, saying it can't be reached while the phone has internet", async () => {
  const { result } = await renderStore();
  expect(result.current.isOffline).toBe(false);

  await serverAnswers(false);

  expect(result.current.isOffline).toBe(true);
  expect(result.current.offlineReason).toBe('server');
  expect(result.current.notice).toBe("Can't reach the server");
});

it('says there is no internet when the phone has none either', async () => {
  const { result, rerender } = await renderStore();
  mockedUseNetworkState.mockReturnValue(offline);
  await rerender({});
  expect(result.current.isOffline).toBe(false);

  await serverAnswers(false);

  expect(result.current.offlineReason).toBe('internet');
  expect(result.current.notice).toBe('No internet connection');
});

it('has the server tried as soon as the phone says it lost its connection', async () => {
  const { rerender } = await renderStore();
  expect(mockedCheckServer).not.toHaveBeenCalled();

  mockedUseNetworkState.mockReturnValue(offline);
  await rerender({});

  expect(mockedCheckServer).toHaveBeenCalledTimes(1);
});

it('tries the server every few seconds while offline', async () => {
  await renderStore();
  await serverAnswers(false);

  await act(() => jest.advanceTimersByTimeAsync(4000));

  expect(mockedCheckServer).toHaveBeenCalledTimes(2);
});

it('says "Back online" and reloads once the server answers again, not before', async () => {
  const reload = jest.fn();
  const { result } = await renderStore(reload);
  await serverAnswers(false);
  expect(reload).not.toHaveBeenCalled();

  await serverAnswers(true);

  expect(result.current.isOffline).toBe(false);
  expect(result.current.offlineReason).toBeNull();
  expect(result.current.notice).toBe('Back online');
  expect(reload).toHaveBeenCalledTimes(1);
});

it('says for a moment what does not work offline', async () => {
  const { result } = await renderStore();
  await serverAnswers(false);
  await act(() => jest.advanceTimersByTimeAsync(2000));

  await act(() => result.current.explainOffline('Feed'));
  expect(result.current.notice).toBe("Feed doesn't work offline");

  await act(() => jest.advanceTimersByTimeAsync(2000));
  expect(result.current.notice).toBeNull();
});
