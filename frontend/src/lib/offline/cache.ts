import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError } from '@/lib/auth/api-client';

// Every saved copy's key starts with this, so clearCache() removes them all and nothing else.
// ponytail: a saved copy is trusted as it is; if a cached response ever changes shape, change
// the prefix so copies from older app versions are ignored instead of read.
const PREFIX = 'cache:';

interface Saved<T> {
  data: T;
  /** When it was fetched (ISO). */
  savedAt: string;
}

/** The copy saved under key, or null when there's none (or it can't be read). */
export async function readCache<T>(key: string): Promise<Saved<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Saved<T>) : null;
  } catch {
    // An unreadable copy is the same as none.
    return null;
  }
}

/** Saves data under key, stamped with the time. Never rejects. */
export async function writeCache<T>(key: string, data: T): Promise<void> {
  const saved: Saved<T> = { data, savedAt: new Date().toISOString() };
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(saved));
  } catch {
    // Not saved (e.g. the device is full): the screen has the fresh data, it just won't be there offline.
  }
}

/**
 * request(), keeping a copy of the result on the device for next time. Only when there's no
 * answer (status 0: no connection, or none in time) does the promise resolve to the copy saved
 * last time, with when it was saved; without a copy, or for any other error, it rejects as
 * request() did. The server always goes first, so while it can be reached the screen never
 * shows an old copy, whose photo links may have expired.
 */
export async function cachedFetch<T>(key: string, request: () => Promise<T>): Promise<{ data: T; savedAt: string | null }> {
  try {
    const data = await request();
    writeCache(key, data);
    return { data, savedAt: null };
  } catch (err) {
    const copy = err instanceof ApiError && err.status === 0 ? await readCache<T>(key) : null;
    if (!copy) throw err;
    return copy;
  }
}

/**
 * Forgets every saved copy, so the next account to sign in on this device never sees this
 * one's. Rejects if the device's storage fails, so signing in can stop instead of going ahead.
 */
export async function clearCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(PREFIX)));
}
