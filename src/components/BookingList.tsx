import { CalendarClock, Clock } from 'lucide-react';
import { formatTime } from '../bookingInput';
import type { Room } from '../types';

export function BookingList({ room }: { room: Room }) {
  if (room.bookings.length === 0) return null;
  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
        <CalendarClock className="h-4 w-4 text-blue-600" />
        Existing bookings for {room.name}
      </div>
      <div className="flex flex-wrap gap-2">
        {room.bookings.map((b, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600"
          >
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {formatTime(b.start)} – {formatTime(b.end)}
            <span className="text-slate-400">({b.start}–{b.end})</span>
          </span>
        ))}
      </div>
    </div>
  );
}
