import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError } from '@/lib/auth/api-client';

// Every saved copy's key starts with this, so clearCache() removes them all and nothing else.
// ponytail: a saved copy is trusted as it is; if a cached response ever changes shape, change
// the prefix so copies from older app versions are ignored instead of read.
const PREFIX = 'cache:';

interface Saved<T> {
  data: T;
  savedAt: string;
}

export async function readCache<T>(key: string): Promise<Saved<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Saved<T>) : null;
  } catch {
    // An unreadable copy is the same as none.
    return null;
  }
}

/** Never rejects. */
export async function writeCache<T>(key: string, data: T): Promise<void> {
  const saved: Saved<T> = { data, savedAt: new Date().toISOString() };
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(saved));
  } catch {
    // Not saved (e.g. the device is full): the screen has the fresh data, it just won't be there offline.
  }
}

/**
 * The server always goes first. Only with no answer (status 0) does this resolve to the copy saved
 * last time, with its savedAt; without a copy, or on any other error, it rejects as request() did.
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

/** Rejects if the device's storage fails, so signing in can stop instead of showing another account's copies. */
export async function clearCache(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((key) => key.startsWith(PREFIX)));
}
