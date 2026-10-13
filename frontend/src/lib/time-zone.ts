/**
 * The device's IANA time zone ("Europe/Amsterdam"). The backend counts watering streaks in
 * it, so "on time" flips at the user's own midnight, like the garden's watering pill. Hermes
 * has Intl on both Android and iOS; UTC is the backend's own fallback if it can't tell.
 */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/** The query string that sends the device's time zone, e.g. "?zone=Europe%2FAmsterdam". */
export function timeZoneQuery(): string {
  return `?zone=${encodeURIComponent(deviceTimeZone())}`;
}
