import { useEffect, useState } from 'react';

import { ApiError, describeError } from '@/lib/auth/api-client';
import type { UserSummary } from '@/lib/user/types';
import { useAuthStore } from '@/stores/auth-store';

import * as friendsService from './friends-service';

const DEBOUNCE_MS = 300;

interface SearchResult {
  query: string;
  users: UserSummary[] | null;
  error: string | null;
}

/** Searches people as the query is typed, waiting for a pause so each keystroke isn't a request. */
export function useUserSearch(query: string) {
  const { setUnauthenticated } = useAuthStore();
  const [result, setResult] = useState<SearchResult | null>(null);
  const q = query.trim();

  useEffect(() => {
    if (q === '') return;
    // cancelled drops a slow response for an older query that lands after a newer one.
    let cancelled = false;
    const timer = setTimeout(() => {
      friendsService
        .searchUsers(q)
        .then((users) => {
          if (!cancelled) setResult({ query: q, users, error: null });
        })
        .catch((err) => {
          if (cancelled) return;
          // apiFetch already tried a refresh; a 401 here means the session is gone.
          if (err instanceof ApiError && err.status === 401) {
            setUnauthenticated();
            return;
          }
          setResult({ query: q, users: null, error: describeError(err) });
        });
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, setUnauthenticated]);

  const current = q !== '' && result?.query === q ? result : null;
  // Only while typing on or backspacing the last query: after clearing it, "b" shouldn't flash "jane"'s results.
  const related =
    q !== '' && result !== null && (isPrefix(result.query, q) || isPrefix(q, result.query)) ? result : null;
  return {
    /** While a newer query loads (isLoading), these can be the previous query's results, so the list doesn't blink. */
    users: related?.users ?? null,
    error: current?.error ?? null,
    isLoading: q !== '' && !current,
  };
}

// Search is case-insensitive, so "Jan" → "jane" still counts as typing on.
function isPrefix(prefix: string, text: string) {
  return text.toLowerCase().startsWith(prefix.toLowerCase());
}
