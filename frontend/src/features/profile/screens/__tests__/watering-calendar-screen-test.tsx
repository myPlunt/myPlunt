import { render, screen, userEvent } from '@testing-library/react-native';

import { useWateringCalendar } from '@/features/profile/use-watering-calendar';

import { WateringCalendarScreen } from '../watering-calendar-screen';

jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@/features/profile/use-watering-calendar');

const mockedUseWateringCalendar = jest.mocked(useWateringCalendar);
const retry = jest.fn();
const showPreviousMonth = jest.fn();
const user = userEvent.setup();

function mockCalendar(state: Partial<ReturnType<typeof useWateringCalendar>>) {
  mockedUseWateringCalendar.mockReturnValue({
    month: new Date(2025, 9, 1),
    waterings: [{ id: 'w1', plantId: 'p1', plantName: 'Vera', wateredAt: new Date(2025, 9, 7, 9).toISOString() }],
    error: null,
    isLoading: false,
    canShowNextMonth: true,
    showPreviousMonth,
    showNextMonth: jest.fn(),
    retry,
    ...state,
  });
}

beforeEach(() => {
  mockCalendar({});
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('WateringCalendarScreen', () => {
  it("shows the month's waterings in a calendar", async () => {
    await render(<WateringCalendarScreen />);

    expect(screen.getByRole('header', { name: 'Watering calendar' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: /, 1 watering$/ })).toBeOnTheScreen();
  });

  it('shows the error instead of the calendar and retries when asked', async () => {
    mockCalendar({ error: 'Something went wrong' });
    await render(<WateringCalendarScreen />);

    expect(screen.getByText('Something went wrong')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Previous month' })).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
});
