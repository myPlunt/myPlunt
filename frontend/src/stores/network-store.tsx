import { useNetworkState, type NetworkState } from 'expo-network';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

/** Still checking (undefined) counts as online, so nothing greys out at startup. A server that's down isn't offline. */
export function isOfflineState({ isConnected, isInternetReachable }: NetworkState): boolean {
  return isConnected === false || isInternetReachable === false;
}

interface NetworkStore {
  isOffline: boolean;
  reconnects: number;
  notice: string | null;
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

/** Calls reload each time the connection comes back, not on mount. */
export function useReloadOnReconnect(reload: () => void) {
  const { reconnects } = useNetworkStore();
  const seen = useRef(reconnects);
  useEffect(() => {
    if (reconnects === seen.current) return;
    seen.current = reconnects;
    reload();
  }, [reconnects, reload]);
}
