/** Only has to tell requests apart in the logs; it isn't secret. */
export function createRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;
}
