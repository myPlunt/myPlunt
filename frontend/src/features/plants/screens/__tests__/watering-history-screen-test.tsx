import { render, screen, userEvent } from '@testing-library/react-native';

import { useWateringHistory } from '@/features/plants/use-watering-history';
import type { WateringHistory } from '@/lib/plant/types';

import { WateringHistoryScreen } from '../watering-history-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/plants/use-watering-history');

const mockedUseWateringHistory = jest.mocked(useWateringHistory);
const retry = jest.fn();
const user = userEvent.setup();

// Dates relative to the real "now", in local time, as the screen reads the clock itself.
function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

// The backend already marked each watering and worked out the streaks.
const vera: WateringHistory = {
  plantName: 'Vera',
  wateringFrequencyDays: 3,
  currentStreak: 1,
  bestStreak: 1,
  onTimePercent: 67,
  overdue: false,
  waterings: [
    { id: 'w3', wateredAt: daysFromNow(-2), daysLate: 0 },
    { id: 'w2', wateredAt: daysFromNow(-4), daysLate: 3 },
    { id: 'w1', wateredAt: daysFromNow(-10), daysLate: 0 },
  ],
};

function mockHistory(state: Partial<ReturnType<typeof useWateringHistory>>) {
  mockedUseWateringHistory.mockReturnValue({
    history: vera,
    savedAt: null,
    error: null,
    isLoading: false,
    retry,
    ...state,
  });
}

beforeEach(() => {
  mockHistory({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('WateringHistoryScreen', () => {

  it('shows the streaks and how often the plant was watered on time', async () => {
    await render(<WateringHistoryScreen plantId="p1" />);

    expect(screen.getByRole('header', { name: 'Watering history' })).toBeOnTheScreen();
    expect(screen.getByText('Vera')).toBeOnTheScreen();
    expect(screen.getByLabelText('Current streak: 1')).toBeOnTheScreen();
    expect(screen.getByLabelText('Best streak: 1')).toBeOnTheScreen();
    expect(screen.getByLabelText('On time: 67%')).toBeOnTheScreen();
    expect(screen.getByText(/on the day they.re due, every 3 days/)).toBeOnTheScreen();
  });

  it('lists every watering in the order the backend sends them, marked on time or late', async () => {
    await render(<WateringHistoryScreen plantId="p1" />);

    const rows = screen.getAllByLabelText(/^Watered /);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveAccessibleName(/^Watered 2 days ago, .*, on time$/);
    expect(rows[1]).toHaveAccessibleName(/^Watered 4 days ago, .*, 3 days late$/);
    expect(rows[2]).toHaveAccessibleName(/^Watered 10 days ago, .*, on time$/);
  });

  it('shows the error and retries when asked', async () => {
    mockHistory({ history: null, error: 'Plant not found' });
    await render(<WateringHistoryScreen plantId="p1" />);

    expect(screen.getByText('Plant not found')).toBeOnTheScreen();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
