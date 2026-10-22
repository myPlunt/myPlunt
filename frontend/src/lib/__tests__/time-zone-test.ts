import { deviceTimeZone, timeZoneQuery } from '@/lib/time-zone';

function mockTimeZone(timeZone: string | undefined) {
  jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone }),
  } as unknown as Intl.DateTimeFormat);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('deviceTimeZone', () => {

  it('falls back to UTC when the device reports none', () => {
    mockTimeZone(undefined);

    expect(deviceTimeZone()).toBe('UTC');
  });
});

describe('timeZoneQuery', () => {
  it('encodes the slash in the zone name', () => {
    mockTimeZone('America/Argentina/Buenos_Aires');

    expect(timeZoneQuery()).toBe('?zone=America%2FArgentina%2FBuenos_Aires');
  });
});
