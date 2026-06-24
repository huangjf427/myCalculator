import type { ReactNode } from 'react';

interface FormRowProps {
  children: ReactNode;
  cols?: 2 | 3;
}

export function FormRow({ children, cols = 2 }: FormRowProps) {
  const gridClass = cols === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return <div className={`grid ${gridClass} gap-4`}>{children}</div>;
}
