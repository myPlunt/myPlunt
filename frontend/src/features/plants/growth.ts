const DAY_MS = 24 * 60 * 60 * 1000;

/** Same as the backend's UpdatePlantPhotoRequest. */
export const CAPTION_MAX_LENGTH = 280;

export function timeBetween(from: string, to: string, short = false): string {
  const start = new Date(from);
  const end = new Date(to);
  let months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  // 20 Jan to 5 Feb is not a month yet.
  if (end.getDate() < start.getDate()) months--;
  const years = Math.floor(months / 12);
  if (years >= 1) return short ? `${years} yr` : `${years} ${years === 1 ? 'year' : 'years'}`;
  if (months >= 1) return short ? `${months} mo` : `${months} ${months === 1 ? 'month' : 'months'}`;

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  // Rounded because a day across a daylight-saving change is 23 or 25 hours long.
  const days = Math.round((endDay - startDay) / DAY_MS);
  if (days === 0) return short ? '0 d' : 'Same day';
  return short ? `${days} d` : `${days} ${days === 1 ? 'day' : 'days'}`;
}

export function photoMonth(takenAt: string): string {
  return new Date(takenAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}
