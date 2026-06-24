import { FormLabel, FORM_CLASS } from './FormLabel';

interface FormTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function FormTextarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: FormTextareaProps) {
  return (
    <div>
      <FormLabel label={label} />
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={FORM_CLASS.input}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  );
}
