import { FormLabel, FORM_CLASS } from './FormLabel';

interface FormDateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function FormDateInput({
  label,
  value,
  onChange,
  required = false,
}: FormDateInputProps) {
  return (
    <div>
      <FormLabel label={label} required={required} />
      <input
        type="date"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={FORM_CLASS.input}
        required={required}
      />
    </div>
  );
}
