// Time limits and range checks shared by the booking rule and the "Requested slot" hint.
// Before the refactoring these checks were written twice (checkAvailability.ts and bookingInput.ts).

export const MINUTE_LIMIT = 1440;
export const MAX_DURATION = 120;

/** Every value must be a finite whole number of minutes. */
export function wholeMinutesError(...values: number[]): string | null {
  if (!values.every(Number.isFinite)) return 'All time fields must be valid numbers.';
  if (!values.every(Number.isInteger)) return 'Times must be whole minutes (e.g. 660).';
  return null;
}

/** AC1: 0 <= start < end <= 1440. */
export function rangeError(start: number, end: number): string | null {
  if (start < 0 || end > MINUTE_LIMIT) {
    return `Times must be within 0–${MINUTE_LIMIT} minutes (midnight to midnight).`;
  }
  if (start >= end) return 'Start time must be earlier than end time.';
  return null;
}
