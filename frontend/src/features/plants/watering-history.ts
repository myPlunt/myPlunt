export function lateLabel(daysLate: number): string {
  if (daysLate === 0) return 'On time';
  return `${daysLate} ${daysLate === 1 ? 'day' : 'days'} late`;
}
