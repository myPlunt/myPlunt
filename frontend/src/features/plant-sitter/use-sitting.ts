import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { CareRequest } from '@/lib/user/types';

import * as plantSitterService from './plant-sitter-service';

/** The accepted stay the user is plant-sitting for, or null; the garden just leaves the switch out on errors. */
export function useSitting() {
  const [stay, setStay] = useState<CareRequest | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      plantSitterService
        .getCareRequests()
        .then((result) => {
          if (!cancelled) setStay(result.received.find((request) => request.status === 'active') ?? null);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return stay;
}
