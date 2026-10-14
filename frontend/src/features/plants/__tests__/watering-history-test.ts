import { lateLabel } from '@/features/plants/watering-history';

describe('lateLabel', () => {
  it('says on time or how many days late', () => {
    expect(lateLabel(0)).toBe('On time');
    expect(lateLabel(1)).toBe('1 day late');
    expect(lateLabel(4)).toBe('4 days late');
  });
});
