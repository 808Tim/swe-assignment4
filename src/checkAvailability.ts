import type { AvailabilityTarget, AvailabilityResult } from './types';
import { MAX_DURATION, rangeError, wholeMinutesError } from './timeRules';

export function checkAvailability(
  room: AvailabilityTarget,
  start: number,
  end: number,
  currentTime: number
): AvailabilityResult {
  // AC1: 0 <= start < end <= 1440 and start strictly after current time
  const timeError = wholeMinutesError(start, end, currentTime) ?? rangeError(start, end);
  if (timeError) {
    return { status: 'unavailable', reason: timeError };
  }

  if (start <= currentTime) {
    return {
      status: 'unavailable',
      reason: 'Start time must be strictly after the current time.',
    };
  }

  // AC2: reject bookings longer than 120 minutes
  if (end - start > MAX_DURATION) {
    return {
      status: 'unavailable',
      reason: `Booking duration exceeds the ${MAX_DURATION}-minute maximum.`,
    };
  }

  // AC3 / F3: reject when room is blocked
  if (room.blocked) {
    return { status: 'unavailable', reason: 'This room is currently blocked and cannot be booked.' };
  }

  // AC4: reject overlap; touching endpoints are allowed
  for (const booking of room.bookings) {
    const overlaps = start < booking.end && end > booking.start;
    if (overlaps) {
      return {
        status: 'unavailable',
        reason: `Overlaps existing booking ${booking.start}–${booking.end}.`,
      };
    }
  }

  return { status: 'available' };
}
