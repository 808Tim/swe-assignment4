// Assignment #04 unit tests: room catalog, filtering rules F1–F5 and AC1–AC5 regression on the new catalog.
// Fixed clock: current time "540" (09:00). The page path is used: form strings → checkRequest.
import { describe, test, expect } from 'vitest';
import { SAMPLE_ROOMS } from '../src/data';
import { checkRequest } from '../src/bookingInput';
import { filterRooms, hasAllEquipment, meetsCapacity, parseAttendees } from '../src/roomFilter';
import type { Equipment, Room } from '../src/types';

const NOW = '540';
const ids = (rooms: readonly Room[]) => rooms.map((r) => r.id);
const room = (id: string) => SAMPLE_ROOMS.find((r) => r.id === id)!;
const find = (attendees: number, equipment: Equipment[] = []) => ids(filterRooms(SAMPLE_ROOMS, { attendees, equipment }));

describe('Room catalog', () => {
  test('C1: at least four rooms, each with id, name, capacity, equipment, blocked status and its own bookings', () => {
    expect(SAMPLE_ROOMS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(ids(SAMPLE_ROOMS)).size).toBe(SAMPLE_ROOMS.length);
    for (const r of SAMPLE_ROOMS) {
      expect(typeof r.name).toBe('string');
      expect(Number.isInteger(r.capacity) && r.capacity > 0).toBe(true);
      expect(Array.isArray(r.equipment)).toBe(true);
      expect(typeof r.blocked).toBe('boolean');
      expect(Array.isArray(r.bookings)).toBe(true);
    }
    // Bookings are not shared between rooms.
    const arrays = SAMPLE_ROOMS.map((r) => r.bookings);
    expect(new Set(arrays).size).toBe(arrays.length);
  });
});

describe('F1 – capacity >= requested attendees', () => {
  test('F1-1: exact capacity (30 attendees, A101 has 30 seats) → A101 is shown', () => {
    expect(meetsCapacity(room('A101'), 30)).toBe(true);
    expect(find(30)).toEqual(['A101', 'C303']);
  });

  test('F1-2: insufficient capacity (31 attendees) → A101 is hidden', () => {
    expect(meetsCapacity(room('A101'), 31)).toBe(false);
    expect(find(31)).toEqual(['C303']);
  });

  test('F1-3: attendees field – empty means no minimum, invalid values are rejected', () => {
    expect(parseAttendees('')).toEqual({ ok: true, value: 0 });
    expect(parseAttendees('12')).toEqual({ ok: true, value: 12 });
    for (const bad of ['0', '-3', '2.5', 'abc']) {
      expect(parseAttendees(bad)).toEqual({ ok: false, reason: 'Attendees must be a whole number of at least 1.' });
    }
    expect(find(0)).toEqual(ids(SAMPLE_ROOMS));
  });
});

describe('F2 – room must contain ALL selected equipment', () => {
  test('F2-1: projector + whiteboard → only rooms that have both', () => {
    expect(find(0, ['projector', 'whiteboard'])).toEqual(['A101', 'C303']);
  });

  test('F2-2: a room with only some of the items is excluded (B202 has a whiteboard but no projector)', () => {
    expect(hasAllEquipment(room('B202'), ['whiteboard'])).toBe(true);
    expect(hasAllEquipment(room('B202'), ['whiteboard', 'projector'])).toBe(false);
    expect(find(0, ['projector', 'computers'])).toEqual(['E505']);
  });

  test('F2-3: capacity and equipment combine (AND): 10 attendees + video conference → C303 only', () => {
    // D404 has video conference but only 8 seats.
    expect(find(10, ['video-conference'])).toEqual(['C303']);
  });
});

describe('F3 – a blocked room is never reported as available', () => {
  test('F3-1: every blocked room is rejected for an otherwise valid slot', () => {
    const blocked = SAMPLE_ROOMS.filter((r) => r.blocked);
    expect(blocked.length).toBeGreaterThan(0);
    for (const r of blocked) {
      expect(checkRequest(r, NOW, '660', '720')).toEqual({
        status: 'unavailable',
        reason: 'This room is currently blocked and cannot be booked.',
      });
    }
  });

  test('F3-2: C303 matches the filters but still cannot be available', () => {
    const [match] = filterRooms(SAMPLE_ROOMS, { attendees: 10, equipment: ['video-conference'] });
    expect(match.id).toBe('C303');
    expect(checkRequest(match, NOW, '780', '840').status).toBe('unavailable');
  });
});

describe('F4 – no matching rooms', () => {
  test('F4-1: equipment combination no room has → empty list', () => {
    expect(find(0, ['computers', 'video-conference'])).toEqual([]);
  });

  test('F4-2: more attendees than the largest room (41 > 40) → empty list', () => {
    expect(find(40)).toEqual(['C303']);
    expect(find(41)).toEqual([]);
  });
});

describe('F5 – the check uses the chosen room bookings, not another room', () => {
  test('F5-1: the same request gives each room its own result', () => {
    expect(checkRequest(room('A101'), NOW, '660', '720')).toEqual({ status: 'available' });
    expect(checkRequest(room('D404'), NOW, '660', '720')).toEqual({
      status: 'unavailable',
      reason: 'Overlaps existing booking 660–720.',
    });
    expect(checkRequest(room('E505'), NOW, '660', '720')).toEqual({ status: 'available' });
    expect(checkRequest(room('E505'), NOW, '720', '780')).toEqual({
      status: 'unavailable',
      reason: 'Overlaps existing booking 720–780.',
    });
    expect(checkRequest(room('A101'), NOW, '720', '780')).toEqual({ status: 'available' });
  });
});

describe('AC1–AC5 regression on the new catalog (form → rule)', () => {
  test('AC1: past start (500–560) and reversed interval (750–720) → unavailable', () => {
    expect(checkRequest(room('B202'), NOW, '500', '560')).toEqual({
      status: 'unavailable',
      reason: 'Start time must be strictly after the current time.',
    });
    expect(checkRequest(room('B202'), NOW, '750', '720')).toEqual({
      status: 'unavailable',
      reason: 'Start time must be earlier than end time.',
    });
  });

  test('AC2: exactly 120 minutes (720–840) → available; 121 minutes (720–841) → unavailable', () => {
    expect(checkRequest(room('B202'), NOW, '720', '840')).toEqual({ status: 'available' });
    expect(checkRequest(room('B202'), NOW, '720', '841')).toEqual({
      status: 'unavailable',
      reason: 'Booking duration exceeds the 120-minute maximum.',
    });
  });

  test('AC3: blocked room C303 → unavailable', () => {
    expect(checkRequest(room('C303'), NOW, '660', '720').status).toBe('unavailable');
  });

  test('AC4: touching (570–600, 660–720) → available; overlapping (630–690, 659–720) → unavailable', () => {
    expect(checkRequest(room('A101'), NOW, '570', '600')).toEqual({ status: 'available' });
    expect(checkRequest(room('A101'), NOW, '660', '720')).toEqual({ status: 'available' });
    expect(checkRequest(room('A101'), NOW, '630', '690').status).toBe('unavailable');
    expect(checkRequest(room('A101'), NOW, '659', '720').status).toBe('unavailable');
    // D404 has two bookings; 720–840 touches both and overlaps neither.
    expect(checkRequest(room('D404'), NOW, '720', '840')).toEqual({ status: 'available' });
  });

  test('AC5: filtering and checking leave the catalog unchanged', () => {
    const snapshot = structuredClone(SAMPLE_ROOMS);
    for (const r of SAMPLE_ROOMS) {
      for (const [s, e] of [['660', '720'], ['630', '690'], ['720', '841'], ['500', '560']]) {
        checkRequest(r, NOW, s, e);
      }
    }
    const filtered = filterRooms(SAMPLE_ROOMS, { attendees: 10, equipment: ['whiteboard'] });
    expect(filtered).not.toBe(SAMPLE_ROOMS);
    expect(SAMPLE_ROOMS).toEqual(snapshot);
  });
});
