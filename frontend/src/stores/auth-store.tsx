import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { tokenStorage } from '@/lib/auth/token-storage';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  status: AuthStatus;
  setAuthenticated: () => void;
  setUnauthenticated: () => void;
}

const AuthStoreContext = createContext<AuthStore | undefined>(undefined);

export function AuthStoreProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    tokenStorage.getTokens().then((tokens) => {
      setStatus(tokens ? 'authenticated' : 'unauthenticated');
    });
  }, []);

  // Stable setters, so hooks can list them as effect dependencies without
  // re-running every time the status changes.
  const setAuthenticated = useCallback(() => setStatus('authenticated'), []);
  const setUnauthenticated = useCallback(() => setStatus('unauthenticated'), []);

  const value = useMemo<AuthStore>(
    () => ({ status, setAuthenticated, setUnauthenticated }),
    [status, setAuthenticated, setUnauthenticated],
  );

  return <AuthStoreContext.Provider value={value}>{children}</AuthStoreContext.Provider>;
}

export function useAuthStore(): AuthStore {
  const context = useContext(AuthStoreContext);
  if (!context) {
    throw new Error('useAuthStore must be used within an AuthStoreProvider');
  }
  return context;
}
