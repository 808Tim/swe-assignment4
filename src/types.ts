export interface Booking {
  start: number;
  end: number;
}

export type Equipment = 'projector' | 'whiteboard' | 'video-conference' | 'computers';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  equipment: readonly Equipment[];
  blocked: boolean;
  bookings: readonly Booking[];
}

/** The only room fields the booking rule reads (AC3 blocked, AC4 bookings). */
export type AvailabilityTarget = Pick<Room, 'blocked' | 'bookings'>;

export type AvailabilityResult =
  | { status: 'available' }
  | { status: 'unavailable'; reason: string };
