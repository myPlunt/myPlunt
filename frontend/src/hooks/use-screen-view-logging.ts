import { usePathname } from 'expo-router';
import { useEffect } from 'react';

import { logAction, setCurrentRoute } from '@/lib/logger';

export function useScreenViewLogging() {
  const pathname = usePathname();

  useEffect(() => {
    setCurrentRoute(pathname);
    logAction('screen_viewed');
  }, [pathname]);
}
