// Dev-only for now: in a dev build console.warn shows up in the Metro terminal and
// as a LogBox notice in the app. (console.error would raise LogBox's red banner for
// every failed request.) Release builds log nothing until we add crash reporting.
export function logError(message: string, details?: unknown) {
  if (__DEV__) {
    console.warn(`[myPlunt] ${message}`, details ?? '');
  }
}
