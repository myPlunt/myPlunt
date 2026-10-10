import { uploadPhoto } from '@/features/photos/photo-service';
import { ApiError, apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({
  ...jest.requireActual('@/lib/auth/api-client'),
  apiFetch: jest.fn(),
}));

const mockedApiFetch = jest.mocked(apiFetch);
const fetchMock = jest.fn();
const file = { size: 3 };

beforeEach(() => {
  globalThis.fetch = fetchMock;
  mockedApiFetch.mockResolvedValue({ uploadUrl: 'https://storage.test/upload?signed', key: 'plants/u1/a.jpg' });
  // First call reads the local file, second is the PUT to storage.
  fetchMock.mockResolvedValueOnce({ blob: () => Promise.resolve(file) });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('uploadPhoto', () => {
  it('asks the backend for an upload URL, PUTs the file there and returns the key', async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });

    await expect(uploadPhoto('file:///photo.jpg', 'PLANT')).resolves.toBe('plants/u1/a.jpg');

    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/photos/upload-url', {
      method: 'POST',
      body: { category: 'PLANT', contentType: 'image/jpeg' },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'file:///photo.jpg');
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://storage.test/upload?signed', {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg', 'x-amz-tagging': 'pending=true' },
      body: file,
    });
  });

  it('throws a user-safe error when storage rejects the upload', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 403, text: () => Promise.resolve('SignatureDoesNotMatch') });

    await expect(uploadPhoto('file:///photo.jpg', 'PLANT')).rejects.toEqual(
      expect.objectContaining({ status: 403, detail: "Couldn't upload the photo. Please try again." }),
    );
  });

  it('throws a user-safe error when storage cannot be reached', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = await uploadPhoto('file:///photo.jpg', 'PLANT').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toEqual(
      expect.objectContaining({ status: 0, detail: "Couldn't upload the photo. Please try again." }),
    );
  });

  it('does not upload anything when the backend refuses an upload URL', async () => {
    mockedApiFetch.mockRejectedValue(new ApiError(400, 'Bad request', { detail: 'Unsupported content type' }));

    await expect(uploadPhoto('file:///photo.jpg', 'PLANT')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
