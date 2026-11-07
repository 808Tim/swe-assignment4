import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { SAMPLE_ROOMS } from './data';
import { checkRequest, requestedSlotLabel } from './bookingInput';
import { filterRooms, parseAttendees } from './roomFilter';
import { RoomFilters } from './components/RoomFilters';
import { RoomList } from './components/RoomList';
import { BookingList } from './components/BookingList';
import { TimeField } from './components/TimeField';
import { ResultPanel } from './components/ResultPanel';
import type { Equipment } from './types';

/** Form values captured when "Check availability" was pressed. */
interface CheckedRequest {
  current: string;
  start: string;
  end: string;
}

function App() {
  const [attendeesStr, setAttendeesStr] = useState('');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [roomId, setRoomId] = useState<string>(SAMPLE_ROOMS[0].id);
  const [startStr, setStartStr] = useState('');
  const [endStr, setEndStr] = useState('');
  const [currentStr, setCurrentStr] = useState('');
  const [checked, setChecked] = useState<CheckedRequest | null>(null);

  // Everything below is derived from state, so the shown room, its bookings and the result can never disagree.
  const attendees = parseAttendees(attendeesStr);
  const visibleRooms = attendees.ok ? filterRooms(SAMPLE_ROOMS, { attendees: attendees.value, equipment }) : [];
  // If the selected room is filtered out, the first matching room becomes the selection.
  const selectedRoom = visibleRooms.find((r) => r.id === roomId) ?? visibleRooms[0] ?? null;
  // F5: the result is recomputed for the selected room, so switching rooms refreshes it.
  const result =
    checked && selectedRoom ? checkRequest(selectedRoom, checked.current, checked.start, checked.end) : null;
  const slotLabel = requestedSlotLabel(startStr, endStr);

  // Editing a time field clears the old result (same as before the refactoring).
  const editTime = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setChecked(null);
  };

  function toggleEquipment(item: Equipment) {
    setEquipment((list) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 text-slate-800">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-8 text-center sm:mb-10">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <MapPin className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Smart Campus Room Availability
          </h1>
          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Check whether a campus room is available for your requested time slot.
          </p>
        </header>

        <RoomFilters
          attendees={attendeesStr}
          attendeesError={attendees.ok ? null : attendees.reason}
          equipment={equipment}
          onAttendeesChange={setAttendeesStr}
          onToggleEquipment={toggleEquipment}
        />

        <RoomList
          rooms={visibleRooms}
          selectedId={selectedRoom?.id ?? null}
          emptyMessage={
            attendees.ok
              ? 'No room has enough seats and all the selected equipment. Lower the number of attendees or clear some equipment.'
              : attendees.reason
          }
          onSelect={setRoomId}
        />

        {selectedRoom && <BookingList room={selectedRoom} />}

        {/* Input form */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Enter time details (minutes from midnight)
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <TimeField id="current-time" label="Current time" placeholder="e.g. 540"
              hint="0 = 00:00, 1440 = 24:00" value={currentStr} onChange={editTime(setCurrentStr)} />
            <TimeField id="start-time" label="Start time" placeholder="e.g. 660"
              hint="Must be after current time" value={startStr} onChange={editTime(setStartStr)} />
            <TimeField id="end-time" label="End time" placeholder="e.g. 720"
              hint="Max 120-min duration" value={endStr} onChange={editTime(setEndStr)} />
          </div>

          {slotLabel && <p className="mt-3 text-xs text-slate-500">Requested slot: {slotLabel}</p>}

          <button
            onClick={() => setChecked({ current: currentStr, start: startStr, end: endStr })}
            disabled={!selectedRoom}
            className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto sm:px-8"
          >
            Check availability
          </button>
          {!selectedRoom && <p className="mt-2 text-xs text-slate-500">Select a matching room to check availability.</p>}
        </section>

        {result && selectedRoom && <ResultPanel result={result} roomName={selectedRoom.name} />}

        {/* Footer note */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          Checker only — no bookings are saved or confirmed. Sample data for demonstration.
        </footer>
      </div>
    </div>
  );
}

export default App;
