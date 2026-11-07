import { Users } from 'lucide-react';
import { EQUIPMENT_LABELS } from '../data';
import type { Equipment } from '../types';

interface RoomFiltersProps {
  attendees: string;
  attendeesError: string | null;
  equipment: readonly Equipment[];
  onAttendeesChange: (value: string) => void;
  onToggleEquipment: (item: Equipment) => void;
}

const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS) as Equipment[];

export function RoomFilters({
  attendees,
  attendeesError,
  equipment,
  onAttendeesChange,
  onToggleEquipment,
}: RoomFiltersProps) {
  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Room requirements</h2>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <div>
          <label htmlFor="attendees" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-slate-400" /> Attendees
          </label>
          <input
            id="attendees"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="e.g. 10"
            value={attendees}
            onChange={(e) => onAttendeesChange(e.target.value)}
            aria-invalid={attendeesError !== null}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          {attendeesError ? (
            <p className="mt-1 text-xs text-red-600">{attendeesError}</p>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Empty = any size</p>
          )}
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Required equipment (all of)</legend>
          <div className="flex flex-wrap gap-2">
            {ALL_EQUIPMENT.map((item) => (
              <label
                key={item}
                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
              >
                <input
                  type="checkbox"
                  checked={equipment.includes(item)}
                  onChange={() => onToggleEquipment(item)}
                  className="h-4 w-4 accent-blue-600"
                />
                {EQUIPMENT_LABELS[item]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
