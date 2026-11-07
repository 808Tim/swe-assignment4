// IMPROVED SUITE (after review). Unit tests for the real function used by the page.
// Fixture: now = 540, blocked = false, bookings = [{ start: 600, end: 660 }] — fresh per test.
import { describe, test, expect } from 'vitest';
import { checkAvailability } from '../src/checkAvailability';
import { SAMPLE_ROOMS } from '../src/data';
import type { Room, Booking } from '../src/types';

const NOW = 540;

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: 'A101',
    name: 'Room A101',
    blocked: false,
    bookings: [{ start: 600, end: 660 }],
    ...overrides,
  };
}

/** Act + AC5 check: every call must leave the booking data exactly as it was. */
function check(start: number, end: number, roomOverrides: Partial<Room> = {}, now = NOW) {
  const room = makeRoom(roomOverrides);
  const before: Booking[] = structuredClone(room.bookings);
  const bookingsRef = room.bookings;
  const result = checkAvailability(room, start, end, now);
  expect(room.bookings).toBe(bookingsRef); // same array, not replaced
  expect(room.bookings).toEqual(before); // same content
  expect(room.blocked).toBe(roomOverrides.blocked ?? false);
  return result;
}

type Result = ReturnType<typeof checkAvailability>;

function expectAvailable(r: Result) {
  expect(r).toEqual({ status: 'available' });
}

function expectUnavailable(r: Result, reason: RegExp) {
  expect(r.status).toBe('unavailable');
  if (r.status === 'unavailable') expect(r.reason).toMatch(reason);
}

// Expected rejection reasons, so a test fails if a request is rejected for the wrong rule.
const R = {
  order: /earlier than end/i,
  range: /within 0–1440/i,
  past: /strictly after the current time/i,
  duration: /exceeds the 120-minute/i,
  blocked: /blocked/i,
  overlap: /overlaps existing booking 600–660/i,
};

describe('AC1 – valid time range, start in the future', () => {
  test('T02: 540–570 starts exactly now → unavailable', () => expectUnavailable(check(540, 570), R.past));
  test('T03: 720–720 zero duration → unavailable', () => expectUnavailable(check(720, 720), R.order));
  test('T04: 750–720 reversed → unavailable', () => expectUnavailable(check(750, 720), R.order));
  test('T05: 1380–1441 past day end → unavailable', () => expectUnavailable(check(1380, 1441), R.range));
});

describe('AC2 – maximum duration 120 minutes', () => {
  test('T06: 720–840 exactly 120 min → available', () => expectAvailable(check(720, 840)));
  test('T07: 720–841 121 min → unavailable', () => expectUnavailable(check(720, 841), R.duration));
});

describe('AC3 – blocked room', () => {
  test('T13: 660–720 with blocked = true → unavailable', () =>
    expectUnavailable(check(660, 720, { blocked: true }), R.blocked));
});

describe('AC4 – no overlap, touching endpoints allowed', () => {
  test('T01: 660–720 touching after → available', () => expectAvailable(check(660, 720)));
  test('T08: 570–600 touching before → available', () => expectAvailable(check(570, 600)));
  test('T09: 630–690 partial overlap → unavailable', () => expectUnavailable(check(630, 690), R.overlap));
  test('T10: 570–690 contains booking → unavailable', () => expectUnavailable(check(570, 690), R.overlap));
  test('T11: 615–645 inside booking → unavailable', () => expectUnavailable(check(615, 645), R.overlap));
  test('T12: 600–660 identical interval → unavailable', () => expectUnavailable(check(600, 660), R.overlap));
  test('T14: 630–690 with bookings = [] → available', () =>
    expectAvailable(check(630, 690, { bookings: [] })));
});

describe('AC5 – clear decision and data preservation', () => {
  test('T15: frozen bookings, repeated checks → same decisions, data unchanged', () => {
    const bookings = Object.freeze([Object.freeze({ start: 600, end: 660 })]) as Booking[];
    const room = makeRoom({ bookings });
    // Frozen data: any write inside the function would throw (ES modules run in strict mode).
    const first = [checkAvailability(room, 660, 720, NOW), checkAvailability(room, 630, 690, NOW)];
    const second = [checkAvailability(room, 660, 720, NOW), checkAvailability(room, 630, 690, NOW)];
    expect(first).toEqual(second);
    expect(first[0]).toEqual({ status: 'available' });
    expect(first[1].status).toBe('unavailable');
    expect(room.bookings).toEqual([{ start: 600, end: 660 }]);
  });

  test('T16: the page sample data (SAMPLE_ROOMS) is unchanged after many checks', () => {
    const snapshot = structuredClone(SAMPLE_ROOMS);
    for (const room of SAMPLE_ROOMS) {
      checkAvailability(room, 660, 720, NOW);
      checkAvailability(room, 630, 690, NOW);
      checkAvailability(room, 720, 841, NOW);
    }
    expect(SAMPLE_ROOMS).toEqual(snapshot);
  });
});

describe('Own justified cases', () => {
  // AC1: end <= 1440, so the upper limit itself is allowed. Detects an `end >= 1440` off-by-one.
  test('T17: 1380–1440 ends exactly at midnight → available', () => expectAvailable(check(1380, 1440)));

  // AC1: start must be strictly after now, so the first allowed minute is now + 1.
  // Detects an over-strict check such as `start <= now + 1`.
  test('T18: 541–600 starts one minute after now → available', () => expectAvailable(check(541, 600)));

  // AC4 must hold against every booking, not only the first one.
  // Detects a loop that only checks bookings[0] or stops early.
  test('T19: overlap with the second of two bookings → unavailable', () => {
    const r = check(780, 840, {
      bookings: [
        { start: 600, end: 660 },
        { start: 800, end: 900 },
      ],
    });
    expectUnavailable(r, /overlaps existing booking 800–900/i);
  });

  // AC6: invalid input (an empty/garbled field becomes NaN) must be rejected with a clear reason.
  test('T20: NaN / fractional times → unavailable with a clear reason', () => {
    expectUnavailable(check(NaN, 720), /valid numbers/i);
    expectUnavailable(check(660.5, 720), /whole minutes/i);
  });
});
