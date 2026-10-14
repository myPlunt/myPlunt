/**
 * An id for one request, sent as X-Request-ID so the app's log lines about it can be matched
 * with the backend's. Only has to be unique enough to tell requests apart, not secret.
 */
export function createRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;
}
