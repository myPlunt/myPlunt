import { apiFetch, ApiError, describeError, publicFetch } from '@/lib/auth/api-client';
import { tokenStorage } from '@/lib/auth/token-storage';
import { logError } from '@/lib/logger';

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

  it('throws ApiError with the status on a non-2xx response', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(409));

    await expect(publicFetch('/v1/auth/register', {})).rejects.toMatchObject({ status: 409 });
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
  it('prefers the backend detail over any status fallback', () => {
    const error = new ApiError(401, 'irrelevant', { detail: 'Invalid credentials' });
    expect(describeError(error, { 401: 'Fallback message' })).toBe('Invalid credentials');
  });

  it('falls back to the status map when the backend sent no detail', () => {
    const error = new ApiError(401, 'irrelevant');
    expect(describeError(error, { 401: 'Invalid credentials.' })).toBe('Invalid credentials.');
  });

  it('falls back to a generic message for an unmapped status or non-ApiError', () => {
    expect(describeError(new ApiError(500, 'x'), { 401: 'Invalid credentials.' })).toBe(
      'Something went wrong. Please try again.',
    );
    expect(describeError(new Error('network down'), { 401: 'Invalid credentials.' })).toBe(
      'Something went wrong. Please try again.',
    );
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
});

describe('failed requests', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    globalThis.fetch = jest.fn();
    mockedTokenStorage.getTokens.mockResolvedValue({ accessToken: 'access-1', refreshToken: 'refresh-1' });
  });

  it('turns "no response" into an ApiError with status 0 and a user-safe message, and logs it', async () => {
    const networkError = new TypeError('Network request failed');
    (globalThis.fetch as jest.Mock).mockRejectedValueOnce(networkError);

    const error = await apiFetch('/v1/plants', { method: 'POST', body: {} }).catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 0 });
    expect(describeError(error)).toBe("Can't reach myPlunt right now. Check your connection and try again.");
    expect(jest.mocked(logError)).toHaveBeenCalledWith(expect.stringContaining('POST /v1/plants got no response'), networkError);
  });

  it('logs the method, path, status and body of an error response', async () => {
    const body = { detail: 'An unexpected error occurred' };
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(500, body));

    await expect(apiFetch('/v1/plants', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 500 });

    expect(jest.mocked(logError)).toHaveBeenCalledWith('POST /v1/plants failed with 500', body);
  });

  it('does not log the failures of a silent request, so the logger cannot report its own failures', async () => {
    (globalThis.fetch as jest.Mock)
      .mockRejectedValueOnce(new TypeError('Network request failed'))
      .mockResolvedValueOnce(jsonResponse(400, { errors: { platform: 'Platform must not be blank.' } }));

    await expect(apiFetch('/v1/client-logs', { method: 'POST', body: {}, silent: true })).rejects.toMatchObject({ status: 0 });
    await expect(apiFetch('/v1/client-logs', { method: 'POST', body: {}, silent: true })).rejects.toMatchObject({ status: 400 });

    expect(jest.mocked(logError)).not.toHaveBeenCalled();
  });

  it('does not log successful requests', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(jsonResponse(200, {}));

    await apiFetch('/v1/plants');

    expect(jest.mocked(logError)).not.toHaveBeenCalled();
  });
});

