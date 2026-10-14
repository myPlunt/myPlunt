import { render, screen, userEvent } from '@testing-library/react-native';

import type { WateringLog } from '@/lib/plant/types';

import { WateringCalendar } from '../watering-calendar';

const user = userEvent.setup();
const onPreviousMonth = jest.fn();
const onNextMonth = jest.fn();
// Built in local time, so the tests pass in any time zone. A month in the past, so "today"
// (the real date) isn't in it and nothing is picked at first.
const month = new Date(2025, 9, 1);

// The day label follows the device's locale ("7 October" or "October 7"), so build it the same way.
function day(date: number, waterings: string) {
  return `${new Date(2025, 9, date).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}, ${waterings}`;
}

function watering(id: string, plantName: string, date: Date): WateringLog {
  return { id, plantId: plantName.toLowerCase(), plantName, wateredAt: date.toISOString() };
}

const waterings = [
  watering('w1', 'Vera', new Date(2025, 9, 7, 18, 0)),
  watering('w2', 'Basil', new Date(2025, 9, 7, 9, 0)),
  watering('w3', 'Vera', new Date(2025, 9, 3, 9, 0)),
];

function renderCalendar(props: Partial<Parameters<typeof WateringCalendar>[0]> = {}) {
  return render(
    <WateringCalendar
      month={month}
      waterings={waterings}
      isLoading={false}
      canShowNextMonth
      onPreviousMonth={onPreviousMonth}
      onNextMonth={onNextMonth}
      {...props}
    />,
  );
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('WateringCalendar', () => {

  it('lists the plants watered on the day the user picks', async () => {
    await renderCalendar();
    expect(screen.getByText('Pick a blue day to see what you watered.')).toBeOnTheScreen();

    await user.press(screen.getByRole('button', { name: day(7, '2 waterings') }));

    expect(screen.getByRole('button', { name: day(7, '2 waterings') })).toBeSelected();
    expect(screen.getByText('Vera')).toBeOnTheScreen();
    expect(screen.getByText('Basil')).toBeOnTheScreen();
  });

  it('pages between months, and the next month only when there is one', async () => {
    await renderCalendar();

    await user.press(screen.getByRole('button', { name: 'Previous month' }));
    await user.press(screen.getByRole('button', { name: 'Next month' }));

    expect(onPreviousMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });
});
