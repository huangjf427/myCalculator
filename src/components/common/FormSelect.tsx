import { FormLabel, FORM_CLASS } from './FormLabel';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  required?: boolean;
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  required = false,
}: FormSelectProps) {
  return (
    <div>
      <FormLabel label={label} required={required} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={FORM_CLASS.input}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
