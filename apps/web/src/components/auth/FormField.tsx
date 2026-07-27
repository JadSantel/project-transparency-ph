interface FormFieldProps {
  label: string;
  type: 'email' | 'password' | 'text';
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}

export function FormField({ label, type, value, onChange, autoComplete, required, minLength }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal"
      />
    </label>
  );
}
