import { useNetworkState, type NetworkState } from 'expo-network';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { checkServer, onReachabilityChange } from '@/lib/auth/api-client';

/** Still checking (undefined) counts as online. */
export function isOfflineState({ isConnected, isInternetReachable }: NetworkState): boolean {
  return isConnected === false || isInternetReachable === false;
}

export type OfflineReason = 'internet' | 'server';

export const offlineMessages: Record<OfflineReason, string> = {
  internet: 'No internet connection',
  server: "Can't reach the server",
};

interface NetworkStore {
  isOffline: boolean;
  offlineReason: OfflineReason | null;
  reconnects: number;
  notice: string | null;
  explainOffline: (what: string) => void;
}

// Online until told otherwise, so screens and hooks work without the provider (e.g. in tests).
const NetworkStoreContext = createContext<NetworkStore>({
  isOffline: false,
  offlineReason: null,
  reconnects: 0,
  notice: null,
  explainOffline: () => {},
});

const NOTICE_MS = 2000;
const RETRY_OFFLINE_MS = 2000;

// Offline means the server doesn't answer; the phone's own signal only says why.
export function NetworkStoreProvider({ children }: { children: ReactNode }) {
  const phoneOffline = isOfflineState(useNetworkState());
  const [isOffline, setIsOffline] = useState(false);
  const [reconnects, setReconnects] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const wasOffline = useRef(isOffline);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const offlineReason: OfflineReason | null = isOffline ? (phoneOffline ? 'internet' : 'server') : null;

  const showNotice = useCallback((text: string) => {
    clearTimeout(noticeTimer.current);
    setNotice(text);
    noticeTimer.current = setTimeout(() => setNotice(null), NOTICE_MS);
  }, []);

  useEffect(() => onReachabilityChange((reachable) => setIsOffline(!reachable)), []);

  useEffect(() => {
    if (phoneOffline) checkServer();
  }, [phoneOffline]);

  useEffect(() => {
    if (!isOffline) return;
    const timer = setInterval(checkServer, RETRY_OFFLINE_MS);
    return () => clearInterval(timer);
  }, [isOffline]);

  useEffect(() => {
    if (wasOffline.current && !isOffline) {
      setReconnects((count) => count + 1);
      showNotice('Back online');
    } else if (!wasOffline.current && isOffline) {
      showNotice(offlineMessages[phoneOffline ? 'internet' : 'server']);
    }
    wasOffline.current = isOffline;
  }, [isOffline, phoneOffline, showNotice]);

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const explainOffline = useCallback((what: string) => showNotice(`${what} doesn't work offline`), [showNotice]);

  const value = useMemo<NetworkStore>(
    () => ({ isOffline, offlineReason, reconnects, notice, explainOffline }),
    [isOffline, offlineReason, reconnects, notice, explainOffline],
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
