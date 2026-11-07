// Practice #09 regression tests for the refactoring (src/bookingInput.ts extracted from App.tsx).
// Each case goes through the same path as the page: form strings → parseRequest → checkAvailability.
// Fixed clock: current time "540" (09:00). Fresh fixtures per test.
import { describe, test, expect } from 'vitest';
import { checkAvailability } from '../src/checkAvailability';
import { parseRequest, formatTime, requestedSlotLabel } from '../src/bookingInput';
import { SAMPLE_ROOMS } from '../src/data';
import type { Room } from '../src/types';

const NOW = '540';

function makeRoom(overrides: Partial<Room> = {}): Room {
  return { id: 'A101', name: 'Room A101', blocked: false, bookings: [{ start: 600, end: 660 }], ...overrides };
}

/** Same steps as App.handleCheck. */
function checkFromForm(room: Room, current: string, start: string, end: string) {
  const request = parseRequest(current, start, end);
  if (!request.ok) return { status: 'unavailable' as const, reason: request.reason };
  return checkAvailability(room, request.start, request.end, request.current);
}

describe('Step #06 regression list (form → rule)', () => {
  // AC1: start must be strictly after the current time; 500 < 540.
  test('past time: 500–560 → unavailable', () => {
    const r = checkFromForm(makeRoom(), NOW, '500', '560');
    expect(r).toEqual({ status: 'unavailable', reason: 'Start time must be strictly after the current time.' });
  });

  // AC1: start >= end is rejected.
  test('reversed interval: 750–720 → unavailable', () => {
    const r = checkFromForm(makeRoom(), NOW, '750', '720');
    expect(r).toEqual({ status: 'unavailable', reason: 'Start time must be earlier than end time.' });
  });

  // AC2: maximum 120 minutes; 720–841 is 121 minutes and does not overlap any booking.
  test('121-minute duration: 720–841 → unavailable', () => {
    const r = checkFromForm(makeRoom(), NOW, '720', '841');
    expect(r).toEqual({ status: 'unavailable', reason: 'Booking duration exceeds the 120-minute maximum.' });
  });

  // AC3: a blocked room is rejected even for an otherwise valid slot.
  test('blocked room: 660–720 → unavailable', () => {
    const r = checkFromForm(makeRoom({ blocked: true }), NOW, '660', '720');
    expect(r).toEqual({ status: 'unavailable', reason: 'This room is currently blocked and cannot be booked.' });
  });

  // AC4: 630–690 overlaps the 600–660 booking.
  test('overlap: 630–690 → unavailable', () => {
    const r = checkFromForm(makeRoom(), NOW, '630', '690');
    expect(r).toEqual({ status: 'unavailable', reason: 'Overlaps existing booking 600–660.' });
  });

  // AC4: touching endpoints are allowed on both sides.
  test('touching endpoints: 570–600 and 660–720 → available', () => {
    expect(checkFromForm(makeRoom(), NOW, '570', '600')).toEqual({ status: 'available' });
    expect(checkFromForm(makeRoom(), NOW, '660', '720')).toEqual({ status: 'available' });
  });

  // AC5: checks must not change the fixture data used by the page.
  test('unchanged fixtures: SAMPLE_ROOMS identical after many checks', () => {
    const snapshot = structuredClone(SAMPLE_ROOMS);
    for (const room of SAMPLE_ROOMS) {
      for (const [s, e] of [['660', '720'], ['630', '690'], ['720', '841'], ['500', '560']]) {
        checkFromForm(room, NOW, s, e);
      }
    }
    expect(SAMPLE_ROOMS).toEqual(snapshot);
  });
});

describe('bookingInput – behavior kept from App.tsx', () => {
  // AC6: an empty field gives the same clear message as before the refactoring.
  test('parseRequest: any empty field → "Please fill in all three time fields."', () => {
    for (const args of [['', '660', '720'], ['540', '', '720'], ['540', '660', '']] as const) {
      expect(parseRequest(...args)).toEqual({ ok: false, reason: 'Please fill in all three time fields.' });
    }
  });

  test('parseRequest: filled fields → numbers', () => {
    expect(parseRequest('540', '660', '720')).toEqual({ ok: true, start: 660, end: 720, current: 540 });
  });

  test('formatTime: 0 → 00:00, 660 → 11:00, 1440 → 24:00', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(660)).toBe('11:00');
    expect(formatTime(1440)).toBe('24:00');
  });

  test('requestedSlotLabel: well-formed range → label, otherwise null (same conditions as before)', () => {
    expect(requestedSlotLabel('660', '720')).toBe('11:00 – 12:00 (60 min)');
    expect(requestedSlotLabel('', '720')).toBeNull();
    expect(requestedSlotLabel('750', '720')).toBeNull();
    expect(requestedSlotLabel('720', '720')).toBeNull();
    expect(requestedSlotLabel('-10', '720')).toBeNull();
    expect(requestedSlotLabel('1380', '1441')).toBeNull();
    expect(requestedSlotLabel('660.5', '720')).toBeNull();
  });
});
