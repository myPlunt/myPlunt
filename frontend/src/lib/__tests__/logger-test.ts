import { Platform } from 'react-native';

import { apiFetch } from '@/lib/auth/api-client';
import { logError, reportUncaughtErrors } from '@/lib/logger';

// jest.setup.ts mocks the logger for every other test.
jest.unmock('@/lib/logger');
jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));
jest.mock('expo-constants', () => ({ expoConfig: { version: '1.2.3' } }));

const mockedApiFetch = jest.mocked(apiFetch);

function sentBody() {
  return mockedApiFetch.mock.calls[0][1]?.body as Record<string, unknown>;
}

beforeEach(() => {
  mockedApiFetch.mockResolvedValue(undefined);
  // Dev builds also print to the console; that's not what these tests check.
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});

describe('logError', () => {
  it('reports the error to the backend with the platform and app version, without logging that request', () => {
    logError('GET /v1/garden failed with 500', { detail: 'An unexpected error occurred' });

    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/client-logs', {
      method: 'POST',
      body: {
        message: 'GET /v1/garden failed with 500',
        details: '{"detail":"An unexpected error occurred"}',
        platform: Platform.OS,
        appVersion: '1.2.3',
      },
      silent: true,
    });
  });

  it('sends an error as its stack trace', () => {
    const error = new TypeError('Network request failed');

    logError('GET /v1/garden got no response', error);

    expect(sentBody().details).toBe(error.stack);
  });

  it('sends no details when there are none', () => {
    logError('App crashed');

    expect(sentBody().details).toBeUndefined();
  });

  it('trims the message and details to what the backend accepts', () => {
    logError('m'.repeat(1500), 'd'.repeat(9000));

    expect(sentBody().message).toHaveLength(1000);
    expect(sentBody().details).toHaveLength(8000);
  });

  it('drops the report quietly when it cannot be sent', async () => {
    mockedApiFetch.mockRejectedValue(new Error('Not authenticated'));

    expect(() => logError('Could not load the watering streak')).not.toThrow();
    // Lets the rejected report settle; an unhandled rejection would fail the test.
    await Promise.resolve();
  });
});

describe('reportUncaughtErrors', () => {
  const originalHandler = ErrorUtils.getGlobalHandler();
  const previousHandler = jest.fn();

  beforeEach(() => {
    ErrorUtils.setGlobalHandler(previousHandler);
  });

  afterEach(() => {
    ErrorUtils.setGlobalHandler(originalHandler);
  });

  it('reports a fatal error as a crash and hands it on to the previous handler', () => {
    reportUncaughtErrors();
    const error = new Error('Cannot read property of undefined');

    ErrorUtils.getGlobalHandler()(error, true);

    expect(mockedApiFetch).toHaveBeenCalledWith(
      '/v1/client-logs',
      expect.objectContaining({ body: expect.objectContaining({ message: 'App crashed', details: error.stack }) }),
    );
    expect(previousHandler).toHaveBeenCalledWith(error, true);
  });

  it('reports a non-fatal error as uncaught', () => {
    reportUncaughtErrors();

    ErrorUtils.getGlobalHandler()(new Error('boom'), false);

    expect(sentBody().message).toBe('Uncaught error');
    expect(previousHandler).toHaveBeenCalled();
  });
});
