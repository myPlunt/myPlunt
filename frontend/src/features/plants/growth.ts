const DAY_MS = 24 * 60 * 60 * 1000;

/** A growth photo's note or a shared photo's comment; same limit as the backend's AddPlantPhotoRequest and UpdatePlantPhotoRequest. */
export const CAPTION_MAX_LENGTH = 280;

/**
 * The time between two growth photos, in whole years once it's a year or more, whole calendar
 * months once it's a month or more, otherwise in days: "2 years", "5 months", "12 days",
 * "Same day". `short` is for the Growth strip, where there's only room for "2 yr", "5 mo" or "12 d".
 */
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

/** "Aug 2026", for the date on a growth photo. */
export function photoMonth(takenAt: string): string {
  return new Date(takenAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}
