/** Hermes has Intl on Android and iOS; UTC is the backend's own fallback. */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function timeZoneQuery(): string {
  return `?zone=${encodeURIComponent(deviceTimeZone())}`;
}
