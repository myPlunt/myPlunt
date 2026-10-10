import * as planterService from '@/features/planters/planter-service';
import { apiFetch } from '@/lib/auth/api-client';

jest.mock('@/lib/auth/api-client', () => ({ apiFetch: jest.fn() }));

const mockedApiFetch = jest.mocked(apiFetch);

afterEach(() => {
  jest.resetAllMocks();
});

describe('createPlanter', () => {
  it('POSTs the new planter to /v1/planters and returns the saved planter', async () => {
    const saved = { id: 'p1', name: 'Balcony' };
    mockedApiFetch.mockResolvedValue(saved);

    await expect(planterService.createPlanter({ name: 'Balcony' })).resolves.toEqual(saved);
    expect(mockedApiFetch).toHaveBeenCalledWith('/v1/planters', { method: 'POST', body: { name: 'Balcony' } });
  });
});
 