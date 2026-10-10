import { renderHook, waitFor } from '@testing-library/react-native';
import { Query, requestPermissionsAsync } from 'expo-media-library';

// expo-media-library is mocked in jest.setup.ts.
import { useRecentPhotos } from '@/features/photos/use-recent-photos';


const mockedRequestPermissions = jest.mocked(requestPermissionsAsync);
const query = { eq: jest.fn(), orderBy: jest.fn(), limit: jest.fn(), exe: jest.fn() };

function asset(id: string) {
  return { getInfo: () => Promise.resolve({ id, uri: `file:///${id}.jpg`, width: 300, height: 400 }) };
}

beforeEach(() => {
  jest.mocked(Query).mockImplementation(() => query as unknown as Query);
  query.eq.mockReturnValue(query);
  query.orderBy.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.exe.mockResolvedValue([asset('a1'), asset('a2')]);
  mockedRequestPermissions.mockResolvedValue({ granted: true } as Awaited<ReturnType<typeof requestPermissionsAsync>>);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('useRecentPhotos', () => {
  it('loads the newest photos once enabled, asking only for photo access', async () => {
    const { result } = await renderHook(() => useRecentPhotos(true, 8));

    await waitFor(() =>
      expect(result.current).toEqual({
        status: 'ready',
        photos: [
          { id: 'a1', uri: 'file:///a1.jpg', width: 300, height: 400 },
          { id: 'a2', uri: 'file:///a2.jpg', width: 300, height: 400 },
        ],
      }),
    );
    expect(mockedRequestPermissions).toHaveBeenCalledWith(false, ['photo']);
    expect(query.eq).toHaveBeenCalledWith('mediaType', 'image');
    expect(query.orderBy).toHaveBeenCalledWith({ key: 'creationTime', ascending: false });
    expect(query.limit).toHaveBeenCalledWith(8);
  });

  it('does nothing while disabled', async () => {
    const { result } = await renderHook(() => useRecentPhotos(false, 8));

    expect(result.current).toEqual({ status: 'loading' });
    expect(mockedRequestPermissions).not.toHaveBeenCalled();
  });

  it('is unavailable when the user refuses library access', async () => {
    mockedRequestPermissions.mockResolvedValue({ granted: false } as Awaited<
      ReturnType<typeof requestPermissionsAsync>
    >);
    const { result } = await renderHook(() => useRecentPhotos(true, 8));

    await waitFor(() => expect(result.current).toEqual({ status: 'unavailable' }));
    expect(query.exe).not.toHaveBeenCalled();
  });

  it('is unavailable when the library cannot be read', async () => {
    mockedRequestPermissions.mockRejectedValue(new Error('Expo Go has no full media library access'));
    const { result } = await renderHook(() => useRecentPhotos(true, 8));

    await waitFor(() => expect(result.current).toEqual({ status: 'unavailable' }));
  });
});
