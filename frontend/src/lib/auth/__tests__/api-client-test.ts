import {
  apiFetch,
  ApiError,
  canReachServer,
  checkServer,
  describeError,
  onReachabilityChange,
  publicFetch,
} from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';

jest.mock('@/lib/auth/token-storage', () => ({
  tokenStorage: {
    getTokens: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

const mockedTokenStorage = jest.mocked(tokenStorage);

function jsonResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('publicFetch', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn();
  });

  it('POSTs the body and returns the parsed JSON', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const result = await publicFetch('/v1/auth/login', { email: 'a@b.com' });

    expect(result).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/login'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'a@b.com' }) }),
    );
  });

  it('carries the backend ProblemDetail detail through to ApiError', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(409, { detail: 'Email already registered' }),
    );

    await expect(publicFetch('/v1/auth/register', {})).rejects.toMatchObject({
      status: 409,
      detail: 'Email already registered',
    });
  });

  it('carries field-level validation errors through to ApiError', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse(400, { errors: { email: 'must be a well-formed email address' } }),
    );

    await expect(publicFetch('/v1/auth/register', {})).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: 'must be a well-formed email address' },
    });
  });
});

describe('describeError', () => {

  it('falls back to the status map when the backend sent no detail', () => {
    const error = new ApiError(401, 'irrelevant');
    expect(describeError(error, { 401: 'Invalid credentials.' })).toBe('Invalid credentials.');
  });
});

describe('apiFetch', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    globalThis.fetch = jest.fn();
  });

  it('throws without calling fetch when there are no stored tokens', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue(null);

    await expect(apiFetch('/v1/plants')).rejects.toMatchObject({ status: 401 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('attaches the access token and returns the response on success', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200, { plants: [] }));

    const result = await apiFetch('/v1/plants');

    expect(result).toEqual({ plants: [] });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/plants'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-1' }) }),
    );
  });

  it('refreshes once and retries after a 401, then succeeds', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'stale-access',
      refreshToken: 'refresh-1',
    });

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401)) // original request
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' }),
      ) // refresh call
      .mockResolvedValueOnce(jsonResponse(200, { plants: [] })); // retried request

    const result = await apiFetch('/v1/plants');

    expect(result).toEqual({ plants: [] });
    expect(mockedTokenStorage.setTokens).toHaveBeenCalledWith({
      accessToken: 'fresh-access',
      refreshToken: 'fresh-refresh',
    });
    // Retried request used the fresh token, not the stale one.
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/v1/plants'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh-access' }) }),
    );
  });

  it('shares a single refresh call across concurrent 401s', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'stale-access',
      refreshToken: 'refresh-1',
    });

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401)) // request A, original
      .mockResolvedValueOnce(jsonResponse(401)) // request B, original
      .mockResolvedValueOnce(
        jsonResponse(200, { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' }),
      ) // the one shared refresh call
      .mockResolvedValueOnce(jsonResponse(200, { a: true })) // request A, retried
      .mockResolvedValueOnce(jsonResponse(200, { b: true })); // request B, retried

    const [resultA, resultB] = await Promise.all([apiFetch('/v1/a'), apiFetch('/v1/b')]);

    expect(resultA).toEqual({ a: true });
    expect(resultB).toEqual({ b: true });
    expect(globalThis.fetch).toHaveBeenCalledTimes(5);
    expect(mockedTokenStorage.setTokens).toHaveBeenCalledTimes(1);
  });

  it('clears the tokens and propagates the error when the refresh itself fails', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'stale-access',
      refreshToken: 'dead-refresh',
    });

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401)) // original request
      .mockResolvedValueOnce(jsonResponse(401)); // refresh call itself fails

    await expect(apiFetch('/v1/plants')).rejects.toMatchObject({ status: 401 });
    expect(mockedTokenStorage.clearTokens).toHaveBeenCalled();
  });

  it('retries with the stored pair when another request refreshed after this one was sent', async () => {
    // Sent with the old pair; by the time its 401 comes back, another request has refreshed
    // and the backend has deleted refresh-1. Refreshing with it again would log the user out.
    mockedTokenStorage.getTokens
      .mockResolvedValueOnce({ accessToken: 'stale-access', refreshToken: 'refresh-1' })
      .mockResolvedValueOnce({ accessToken: 'fresh-access', refreshToken: 'fresh-refresh' });

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401)) // original request
      .mockResolvedValueOnce(jsonResponse(200, { ok: true })); // retried request

    const result = await apiFetch('/v1/users/me/push-token');

    expect(result).toEqual({ ok: true });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(globalThis.fetch).not.toHaveBeenCalledWith(expect.stringContaining('/v1/auth/refresh'), expect.anything());
    expect(globalThis.fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('/v1/users/me/push-token'),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh-access' }) }),
    );
    expect(mockedTokenStorage.clearTokens).not.toHaveBeenCalled();
  });

  it('keeps the tokens when the refresh fails without a 401', async () => {
    mockedTokenStorage.getTokens.mockResolvedValue({
      accessToken: 'stale-access',
      refreshToken: 'refresh-1',
    });

    (globalThis.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse(401)) // original request
      .mockResolvedValueOnce(jsonResponse(502)); // refresh hits the backend mid-deploy

    await expect(apiFetch('/v1/plants')).rejects.toMatchObject({ status: 502 });
    expect(mockedTokenStorage.clearTokens).not.toHaveBeenCalled();
  });
});

describe('failed requests', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
    globalThis.fetch = jest.fn();
    mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'access-1', refreshToken: 'refresh-1' });
    // Whatever an earlier test left, the server starts out reachable.
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200));
    await checkServer();
    (globalThis.fetch as jest.Mock).mockClear();
  });

  // Nothing comes back until a request is called off, and the server check fails straight away.
  function noAnswer() {
    (globalThis.fetch as jest.Mock).mockImplementation((url: string, { signal }: RequestInit) =>
      url.endsWith('/actuator/health')
        ? Promise.reject(new TypeError('Network request failed'))
        : new Promise((_resolve, reject) => signal?.addEventListener('abort', () => reject(new Error('Aborted')))),
    );
  }

  it('turns "no response" into an ApiError with status 0 and a user-safe message, and logs it as an error', async () => {
    const networkError = new TypeError('Network request failed');
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(networkError);

    const error = await apiFetch('/v1/plants', { method: 'POST', body: {} }).catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0 });
    expect(describeError(error)).toBe("Can't reach myPlunt right now. Check your connection and try again.");
  });

  it('keeps a GET without an answer waiting while the server is tried, and sends it again once it answers', async () => {
    (globalThis.fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(jsonResponse(200))
      .mockResolvedValueOnce(jsonResponse(200, { rooms: [] }));

    expect(await apiFetch('/v1/garden')).toEqual({ rooms: [] });
    const urls = (globalThis.fetch as jest.Mock).mock.calls.map(([url]: [string]) => url.endsWith('/actuator/health'));
    expect(urls).toEqual([false, true, false]);
  });

  it('goes offline after three failed tries, tells whoever listens, and from then on fails straight away', async () => {
    jest.useFakeTimers();
    (globalThis.fetch as jest.Mock).mockRejectedValue(new TypeError('Network request failed'));
    const listener = jest.fn();
    const unsubscribe = onReachabilityChange(listener);

    try {
      let settled = false;
      const request = apiFetch('/v1/garden')
        .catch((err) => err)
        .finally(() => {
          settled = true;
        });
      await jest.advanceTimersByTimeAsync(4000);
      expect(listener).toHaveBeenCalledWith(false);
      // Still loading while the app moves to the garden.
      expect(settled).toBe(false);

      await jest.advanceTimersByTimeAsync(1000);
      expect(await request).toMatchObject({ status: 0 });
      // The request, then three tries.
      expect(globalThis.fetch).toHaveBeenCalledTimes(4);

      (globalThis.fetch as jest.Mock).mockClear();
      expect(await apiFetch('/v1/garden').catch((err) => err)).toMatchObject({ status: 0 });
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    } finally {
      unsubscribe();
      jest.useRealTimers();
    }
  });

  it('gives up on a GET without a response in 10 seconds, then waits while the server is tried', async () => {
    jest.useFakeTimers();
    noAnswer();

    try {
      let settled = false;
      const request = apiFetch('/v1/garden')
        .catch((err) => err)
        .finally(() => {
          settled = true;
        });
      await jest.advanceTimersByTimeAsync(10_000);
      expect(settled).toBe(false);

      await jest.advanceTimersByTimeAsync(5000);
      expect(await request).toMatchObject({ status: 0 });
    } finally {
      jest.useRealTimers();
    }
  });

  it('can reach the server when any answer comes back, even an error, and not without one', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 });
    expect(await canReachServer()).toBe(true);

    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));
    expect(await canReachServer()).toBe(false);
  });

  it('gives up on a write the backend ignores a repeat of, like a GET, but waits on any other', async () => {
    jest.useFakeTimers();
    noAnswer();

    try {
      let otherSettled = false;
      apiFetch('/v1/plants', { method: 'POST', body: {} }).finally(() => {
        otherSettled = true;
      });
      const watering = apiFetch('/v1/plants/p1/waterings', { method: 'POST', idempotent: true }).catch((err) => err);
      await jest.advanceTimersByTimeAsync(15_000);

      expect(await watering).toMatchObject({ status: 0 });
      expect(otherSettled).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});
