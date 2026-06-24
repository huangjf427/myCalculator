import { FormLabel, FORM_CLASS } from './FormLabel';

interface FormInputProps {
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: 'text' | 'number';
  required?: boolean;
  min?: number;
  step?: string;
  placeholder?: string;
}

export function FormInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
  step,
  placeholder,
}: FormInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === 'number') {
      onChange(e.target.value === '' ? 0 : parseFloat(e.target.value));
    } else {
      onChange(e.target.value);
    }
  };

  // 控制 number 类型 value，避免显示 NaN
  const displayValue =
    type === 'number' && (value === null || value === undefined || Number.isNaN(value))
      ? ''
      : value;

  return (
    <div>
      <FormLabel label={label} required={required} />
      <input
        type={type}
        value={displayValue as string | number}
        onChange={handleChange}
        className={FORM_CLASS.input}
        required={required}
        min={min}
        step={step}
        placeholder={placeholder}
      />
    </div>
  );
}
