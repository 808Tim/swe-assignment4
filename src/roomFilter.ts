// Room filtering (F1, F2, F4). Pure functions: they never change the rooms they receive.
import type { Equipment, Room } from './types';

export interface RoomRequirements {
  attendees: number;
  equipment: readonly Equipment[];
}

/** F1: capacity must be greater than or equal to the requested attendees. */
export function meetsCapacity(room: Pick<Room, 'capacity'>, attendees: number): boolean {
  return room.capacity >= attendees;
}

/** F2: the room must contain ALL selected items. */
export function hasAllEquipment(room: Pick<Room, 'equipment'>, required: readonly Equipment[]): boolean {
  return required.every((item) => room.equipment.includes(item));
}

/** Rooms that satisfy every requirement, in catalog order. An empty array means "no match" (F4). */
export function filterRooms<T extends Room>(rooms: readonly T[], req: RoomRequirements): T[] {
  return rooms.filter((room) => meetsCapacity(room, req.attendees) && hasAllEquipment(room, req.equipment));
}

export type ParsedAttendees = { ok: true; value: number } | { ok: false; reason: string };

/** Attendees field: empty = no minimum; otherwise a whole number of at least 1. */
export function parseAttendees(text: string): ParsedAttendees {
  if (text.trim() === '') return { ok: true, value: 0 };
  const value = Number(text);
  if (!Number.isInteger(value) || value < 1) {
    return { ok: false, reason: 'Attendees must be a whole number of at least 1.' };
  }
  return { ok: true, value };
}
