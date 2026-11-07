// Pure helpers between the form (strings) and the booking rule (numbers).

import type { AvailabilityResult, AvailabilityTarget } from './types';
import { checkAvailability } from './checkAvailability';
import { rangeError, wholeMinutesError } from './timeRules';

export type ParsedRequest =
  | { ok: true; start: number; end: number; current: number }
  | { ok: false; reason: string };

/** Turns the three form fields into numbers. Empty fields are rejected before the booking rule runs. */
export function parseRequest(currentStr: string, startStr: string, endStr: string): ParsedRequest {
  if (startStr === '' || endStr === '' || currentStr === '') {
    return { ok: false, reason: 'Please fill in all three time fields.' };
  }
  return { ok: true, start: Number(startStr), end: Number(endStr), current: Number(currentStr) };
}

/** Form strings → decision for ONE room. The page and the tests use this same path. */
export function checkRequest(
  room: AvailabilityTarget,
  currentStr: string,
  startStr: string,
  endStr: string
): AvailabilityResult {
  const request = parseRequest(currentStr, startStr, endStr);
  if (!request.ok) return { status: 'unavailable', reason: request.reason };
  return checkAvailability(room, request.start, request.end, request.current);
}

/** Minutes after midnight → "HH:MM". */
export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Text for the "Requested slot" hint, or null when the range is not well-formed yet. */
export function requestedSlotLabel(startStr: string, endStr: string): string | null {
  if (startStr === '' || endStr === '') return null;
  const start = Number(startStr);
  const end = Number(endStr);
  if (wholeMinutesError(start, end) ?? rangeError(start, end)) return null;
  return `${formatTime(start)} – ${formatTime(end)} (${end - start} min)`;
}
