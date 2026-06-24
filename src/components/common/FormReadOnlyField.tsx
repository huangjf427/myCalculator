import { FormLabel } from './FormLabel';

interface FormReadOnlyFieldProps {
  label: string;
  value: string | number;
  positiveColor?: string;
  negativeColor?: string;
  decimals?: number;
}

export function FormReadOnlyField({
  label,
  value,
  positiveColor = 'text-green-600',
  negativeColor = 'text-red-600',
  decimals = 2,
}: FormReadOnlyFieldProps) {
  const isPositive = typeof value === 'number' ? value >= 0 : true;
  const displayValue =
    typeof value === 'number' ? value.toFixed(decimals) : value;

  return (
    <div>
      <FormLabel label={label} />
      <input
        type="text"
        value={displayValue}
        readOnly
        className={`w-full px-4 py-2 border border-wealth-border rounded-lg bg-gray-50 ${
          isPositive ? positiveColor : negativeColor
        }`}
      />
    </div>
  );
}
