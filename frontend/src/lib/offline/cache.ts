import AsyncStorage from '@react-native-async-storage/async-storage';

import { ApiError } from '@/lib/auth/api-client';

// Every saved copy's key starts with this, so clearCache() removes them all and nothing else.
// ponytail: a saved copy is trusted as it is; if a cached response ever changes shape, change
// the prefix so copies from older app versions are ignored instead of read.
const PREFIX = 'cache:';

interface Saved<T> {
  data: T;
  /** When it was fetched (ISO), for the screen's "updated ..." note. */
  savedAt: string;
}

async function readSaved<T>(key: string): Promise<Saved<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Saved<T>) : null;
  } catch {
    // An unreadable copy is the same as none.
    return null;
  }
}

async function save<T>(key: string, data: T) {
  const saved: Saved<T> = { data, savedAt: new Date().toISOString() };
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(saved));
  } catch {
    // Not saved (e.g. the device is full): the screen has the fresh data, it just won't be there offline.
  }
}

/**
 * request(), keeping a copy of the result on the device for next time. The copy saved last
 * time goes to showSaved as soon as it's read, so the screen isn't empty while the request is
 * out; that can be after the response is back, so show it only if nothing is on screen yet.
 * With no connection (status 0) the promise resolves to that copy, with when it was saved,
 * instead of rejecting; without a copy, or for any other error, it rejects as request() did.
 */
export async function cachedFetch<T>(
  key: string,
  request: () => Promise<T>,
  showSaved: (data: T) => void,
): Promise<{ data: T; savedAt: string | null }> {
  const saved = readSaved<T>(key);
  saved.then((copy) => copy && showSaved(copy.data));
  try {
    const data = await request();
    save(key, data);
    return { data, savedAt: null };
  } catch (err) {
    const copy = await saved;
    if (copy && err instanceof ApiError && err.status === 0) return copy;
    throw err;
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
