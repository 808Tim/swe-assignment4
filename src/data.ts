import type { Equipment, Room } from './types';

// Fictional room catalog. Every room has its own bookings (minutes after midnight).
export const SAMPLE_ROOMS: readonly Room[] = [
  {
    id: 'A101',
    name: 'Room A101',
    capacity: 30,
    equipment: ['projector', 'whiteboard'],
    blocked: false,
    bookings: [{ start: 600, end: 660 }],
  },
  {
    id: 'B202',
    name: 'Room B202',
    capacity: 12,
    equipment: ['whiteboard'],
    blocked: false,
    bookings: [],
  },
  {
    id: 'C303',
    name: 'Room C303',
    capacity: 40,
    equipment: ['projector', 'whiteboard', 'video-conference'],
    blocked: true,
    bookings: [],
  },
  {
    id: 'D404',
    name: 'Room D404',
    capacity: 8,
    equipment: ['whiteboard', 'video-conference'],
    blocked: false,
    bookings: [
      { start: 660, end: 720 },
      { start: 840, end: 900 },
    ],
  },
  {
    id: 'E505',
    name: 'Room E505',
    capacity: 24,
    equipment: ['projector', 'computers'],
    blocked: false,
    bookings: [{ start: 720, end: 780 }],
  },
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  projector: 'Projector',
  whiteboard: 'Whiteboard',
  'video-conference': 'Video conference',
  computers: 'Computers',
};
