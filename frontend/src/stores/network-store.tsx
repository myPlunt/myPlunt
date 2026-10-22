import { useNetworkState, type NetworkState } from 'expo-network';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/**
 * Whether the phone says it has no internet. While it's still checking (undefined) that counts
 * as online, so nothing greys out for a moment at startup. A myPlunt server that's down doesn't
 * count: screens show their usual error for that.
 */
export function isOfflineState({ isConnected, isInternetReachable }: NetworkState): boolean {
  return isConnected === false || isInternetReachable === false;
}

interface NetworkStore {
  isOffline: boolean;
  /** Goes up each time the connection comes back, so a screen on view can reload. */
  reconnects: number;
  /** The floating notice's text ("Feed doesn't work offline", "Back online"); null when there's none. */
  notice: string | null;
  /** Says "<what> doesn't work offline" in the floating notice for a moment. */
  explainOffline: (what: string) => void;
}

// Online until told otherwise, so screens and hooks work without the provider (e.g. in tests).
const NetworkStoreContext = createContext<NetworkStore>({
  isOffline: false,
  reconnects: 0,
  notice: null,
  explainOffline: () => {},
});

const NOTICE_MS = 2000;

export function NetworkStoreProvider({ children }: { children: ReactNode }) {
  const isOffline = isOfflineState(useNetworkState());
  const [reconnects, setReconnects] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const wasOffline = useRef(isOffline);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showNotice = useCallback((text: string) => {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  useEffect(() => {
    if (wasOffline.current && !isOffline) {
      setReconnects((count) => count + 1);
      showNotice('Back online');
    }
    wasOffline.current = isOffline;
  }, [isOffline, showNotice]);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const explainOffline = useCallback((what: string) => showNotice(`${what} doesn't work offline`), [showNotice]);

  const value = useMemo<NetworkStore>(
    () => ({ isOffline, reconnects, notice, explainOffline }),
    [isOffline, reconnects, notice, explainOffline],
  );

  return <NetworkStoreContext.Provider value={value}>{children}</NetworkStoreContext.Provider>;
}

export function useNetworkStore(): NetworkStore {
  return useContext(NetworkStoreContext);
}

/**
 * Calls reload each time the connection comes back (not when first mounted), so what's on
 * screen replaces the copy saved for offline without the user doing anything.
 */
export function useReloadOnReconnect(reload: () => void) {
  const { reconnects } = useNetworkStore();
  const seen = useRef(reconnects);
  useEffect(() => {
    if (reconnects === seen.current) return;
    seen.current = reconnects;
    reload();
  }, [reconnects, reload]);
}
