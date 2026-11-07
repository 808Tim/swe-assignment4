// Practice #08 regression tests: reproduce BUG-A and BUG-B before fixing them.
// Fixed clock (now = 540) and fresh fixtures per test.
import { describe, test, expect } from 'vitest';
import { checkAvailability } from '../src/checkAvailability';
import type { Room } from '../src/types';

const NOW = 540;

function makeRoom(bookings: { start: number; end: number }[]): Room {
  return { id: 'A101', name: 'Room A101', blocked: false, bookings };
}

describe('BUG-A regression – touching endpoints are not conflicts (AC4)', () => {
  // 660–720 sits exactly between 600–660 and 720–780: touches both, overlaps neither.
  test('R-A1: slot touching a booking on both sides → available', () => {
    const room = makeRoom([
      { start: 600, end: 660 },
      { start: 720, end: 780 },
    ]);
    expect(checkAvailability(room, 660, 720, NOW)).toEqual({ status: 'available' });
  });

  // Sanity check that the fix does not swing too far: a 1-minute overlap must still be rejected.
  test('R-A2: one-minute overlap at the end (600–661 vs 660–720) → unavailable', () => {
    const room = makeRoom([{ start: 660, end: 720 }]);
    expect(checkAvailability(room, 600, 661, NOW).status).toBe('unavailable');
  });
  // Added after AI diagnosis (proposed by both runs; reviewed and accepted).
  // One test per side so a half-fixed comparison (only < or only >) cannot pass.
  test('R-A3: request ends exactly when a booking starts (600–660 vs 660–720) → available', () => {
    const room = makeRoom([{ start: 660, end: 720 }]);
    expect(checkAvailability(room, 600, 660, NOW)).toEqual({ status: 'available' });
  });

  test('R-A4: request starts exactly when a booking ends (720–780 vs 660–720) → available', () => {
    const room = makeRoom([{ start: 660, end: 720 }]);
    expect(checkAvailability(room, 720, 780, NOW)).toEqual({ status: 'available' });
  });

  test('R-A5: one-minute overlap at the start (719–780 vs 660–720) → unavailable', () => {
    const room = makeRoom([{ start: 660, end: 720 }]);
    expect(checkAvailability(room, 719, 780, NOW).status).toBe('unavailable');
  });
});

describe('BUG-B regression – booking data is not modified (AC5)', () => {
  // Bookings stored out of order. Any in-place reorder (sort/reverse/splice) changes this array.
  test('R-B1: unsorted bookings keep their order and identity after a check', () => {
    const first = { start: 800, end: 900 };
    const second = { start: 600, end: 660 };
    const bookings = [first, second];
    const room = makeRoom(bookings);

    // 700–760 touches nothing, so this test isolates BUG-B from BUG-A.
    const result = checkAvailability(room, 700, 760, NOW);

    expect(result).toEqual({ status: 'available' });
    expect(room.bookings).toBe(bookings);
    expect(room.bookings).toEqual([
      { start: 800, end: 900 },
      { start: 600, end: 660 },
    ]);
    expect(room.bookings[0]).toBe(first);
    expect(room.bookings[1]).toBe(second);
  });

  // Same data, but frozen: any write attempt throws (strict mode), so the decision cannot be produced.
  test('R-B2: frozen unsorted bookings → no exception, overlap still detected', () => {
    const bookings = Object.freeze([
      Object.freeze({ start: 800, end: 900 }),
      Object.freeze({ start: 600, end: 660 }),
    ]) as Room['bookings'];
    const room = makeRoom(bookings);
    expect(() => checkAvailability(room, 630, 690, NOW)).not.toThrow();
    expect(checkAvailability(room, 630, 690, NOW).status).toBe('unavailable');
  });
  // Added after AI diagnosis (with-skill run; reviewed and accepted): R-B1 only covers 'available',
  // this covers the 'unavailable' path, where the in-place sort also ran.
  test('R-B3: overlap rejection on unsorted bookings leaves data unchanged', () => {
    const bookings = [
      { start: 800, end: 900 },
      { start: 600, end: 660 },
    ];
    const room = makeRoom(bookings);
    const snapshot = structuredClone(room);

    const result = checkAvailability(room, 630, 690, NOW); // overlaps 600–660

    expect(result.status).toBe('unavailable');
    expect(room).toEqual(snapshot);
    expect(room.bookings).toBe(bookings);
  });
});
