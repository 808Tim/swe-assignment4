import { AlertCircle, DoorClosed, SearchX, Users } from 'lucide-react';
import { EQUIPMENT_LABELS } from '../data';
import type { Room } from '../types';

interface RoomListProps {
  rooms: readonly Room[];
  selectedId: string | null;
  emptyMessage: string;
  onSelect: (id: string) => void;
}

export function RoomList({ rooms, selectedId, emptyMessage, onSelect }: RoomListProps) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Select a room ({rooms.length} matching)
      </h2>
      {rooms.length === 0 ? (
        // F4: clear empty state
        <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <SearchX className="mt-0.5 h-6 w-6 flex-shrink-0 text-amber-600" />
          <div>
            <p className="text-base font-semibold text-amber-800">No rooms match</p>
            <p className="mt-1 text-sm text-amber-700">{emptyMessage}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} selected={room.id === selectedId} onSelect={onSelect} />
          ))}
        </div>
      )}
    </section>
  );
}

function RoomCard({ room, selected, onSelect }: { room: Room; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(room.id)}
      aria-pressed={selected}
      className={`flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-600/10'
          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
      }`}
    >
      <div className="flex w-full items-center justify-between">
        <DoorClosed className={`h-5 w-5 ${selected ? 'text-blue-600' : 'text-slate-400'}`} />
        {room.blocked && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            <AlertCircle className="h-3 w-3" /> Blocked
          </span>
        )}
      </div>
      <span className={`text-sm font-semibold ${selected ? 'text-blue-900' : 'text-slate-700'}`}>{room.name}</span>
      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
        <Users className="h-3.5 w-3.5" /> {room.capacity} seats
      </span>
      <span className="flex flex-wrap gap-1">
        {room.equipment.map((item) => (
          <span key={item} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
            {EQUIPMENT_LABELS[item]}
          </span>
        ))}
      </span>
      <span className="text-xs text-slate-400">
        {room.bookings.length === 0
          ? 'No existing bookings'
          : `${room.bookings.length} booking${room.bookings.length > 1 ? 's' : ''}`}
      </span>
    </button>
  );
}
