const LABEL_CLASS = 'block text-sm font-medium text-wealth-text mb-2';
const INPUT_CLASS =
  'w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold';

interface FormLabelProps {
  label: string;
  required?: boolean;
}

export function FormLabel({ label, required }: FormLabelProps) {
  return (
    <label className={LABEL_CLASS}>
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export const FORM_CLASS = {
  label: LABEL_CLASS,
  input: INPUT_CLASS,
};
