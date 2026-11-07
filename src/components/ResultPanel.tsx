import { CheckCircle2, XCircle } from 'lucide-react';
import type { AvailabilityResult } from '../types';

export function ResultPanel({ result, roomName }: { result: AvailabilityResult; roomName: string }) {
  const available = result.status === 'available';
  const Icon = available ? CheckCircle2 : XCircle;
  const tone = available
    ? { box: 'border-emerald-200 bg-emerald-50', icon: 'text-emerald-600', title: 'text-emerald-800', text: 'text-emerald-700' }
    : { box: 'border-red-200 bg-red-50', icon: 'text-red-600', title: 'text-red-800', text: 'text-red-700' };

  return (
    <section className="mt-5" aria-live="polite">
      <div className={`flex items-start gap-3 rounded-xl border p-5 ${tone.box}`}>
        <Icon className={`mt-0.5 h-6 w-6 flex-shrink-0 ${tone.icon}`} />
        <div>
          <p className={`text-base font-semibold ${tone.title}`}>{available ? 'Available' : 'Unavailable'}</p>
          <p className={`mt-1 text-sm ${tone.text}`}>
            {result.status === 'available'
              ? `${roomName} is available for the requested time slot. No existing bookings conflict with this interval.`
              : result.reason}
          </p>
          <p className="mt-2 text-xs text-slate-500">Checked room: {roomName}</p>
        </div>
      </div>
    </section>
  );
}
