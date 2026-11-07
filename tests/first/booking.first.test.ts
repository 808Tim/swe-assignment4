// FIRST SUITE (AI-generated, before review) — kept unchanged as evidence.
// Generated from the Task #03 prompt + case table T01–T14.
import { describe, test, expect } from 'vitest';
import { checkAvailability } from '../../src/checkAvailability';
import type { Room } from '../../src/types';

const NOW = 540;

// Default fixture: now = 540, blocked = false, bookings = [{ start: 600, end: 660 }]
const room: Room = {
  id: 'A101',
  name: 'Room A101',
  blocked: false,
  bookings: [{ start: 600, end: 660 }],
};

describe('checkAvailability – case table', () => {
  test.each([
    ['T01', 660, 720, 'available', 'AC4 touching after'],
    ['T02', 540, 570, 'unavailable', 'AC1 starts now'],
    ['T03', 720, 720, 'unavailable', 'AC1 zero duration'],
    ['T04', 750, 720, 'unavailable', 'AC1 reversed'],
    ['T05', 1380, 1441, 'unavailable', 'AC1 past day end'],
    ['T06', 720, 840, 'available', 'AC2 120 minutes'],
    ['T07', 720, 841, 'unavailable', 'AC2 121 minutes'],
    ['T08', 570, 600, 'available', 'AC4 touching before'],
    ['T09', 630, 690, 'unavailable', 'AC4 partial overlap'],
    ['T10', 570, 690, 'unavailable', 'AC4 contains booking'],
    ['T11', 615, 645, 'unavailable', 'AC4 inside booking'],
    ['T12', 600, 660, 'unavailable', 'AC4 identical interval'],
  ])('%s: %i–%i → %s (%s)', (_id, start, end, expected) => {
    expect(checkAvailability(room, start, end, NOW).status).toBe(expected);
  });

  test('T13: blocked room is rejected (AC3)', () => {
    room.blocked = true;
    expect(checkAvailability(room, 660, 720, NOW).status).toBe('unavailable');
  });

  test('T14: no bookings → overlap slot is available (AC4)', () => {
    room.bookings = [];
    expect(checkAvailability(room, 630, 690, NOW).status).toBe('available');
  });
});

describe('AC5 – data preservation', () => {
  test('existing bookings are not modified', () => {
    const before = JSON.stringify(room.bookings);
    checkAvailability(room, 630, 690, NOW);
    expect(JSON.stringify(room.bookings)).toBe(before);
  });
});
