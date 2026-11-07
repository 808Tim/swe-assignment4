// One labelled number input. Replaces three copy-pasted input blocks from the old App.tsx.
interface TimeFieldProps {
  id: string;
  label: string;
  placeholder: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}

export function TimeField({ id, label, placeholder, hint, value, onChange }: TimeFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        max={1440}
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
      <p className="mt-1 text-xs text-slate-400">{hint}</p>
    </div>
  );
}
