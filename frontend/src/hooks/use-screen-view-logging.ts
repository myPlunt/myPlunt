import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { logAction, setCurrentRoute } from '@/lib/logger';

/** Logs every screen the user opens, by its route ("/plant/<id>"), and tags later lines with it. */
export function useScreenViewLogging() {
  const pathname = usePathname();

  useEffect(() => {
    setCurrentRoute(pathname);
    logAction('screen_viewed');
  }, [pathname]);
}
