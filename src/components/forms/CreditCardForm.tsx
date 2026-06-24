import type { CreditCard } from '@/types';
import { FormInput, FormDateInput, FormTextarea, FormRow } from '@/components/common';

interface CreditCardFormProps {
  formData: Partial<CreditCard>;
  onChange: (data: Partial<CreditCard>) => void;
}

export function CreditCardForm({ formData, onChange }: CreditCardFormProps) {
  return (
    <>
      <FormRow>
        <FormInput
          label="发卡机构"
          value={formData.institution || ''}
          onChange={(value) => onChange({ ...formData, institution: value as string })}
          required
        />
        <FormInput
          label="户名"
          value={formData.accountName || ''}
          onChange={(value) => onChange({ ...formData, accountName: value as string })}
          required
        />
      </FormRow>
      <FormRow>
        <FormInput
          label="金额"
          type="number"
          value={formData.amount ?? 0}
          onChange={(value) => onChange({ ...formData, amount: value as number })}
          required
          min={0}
          step="0.01"
        />
        <FormInput
          label="利率 (%)"
          type="number"
          value={formData.interestRate ?? ''}
          onChange={(value) => onChange({ ...formData, interestRate: value as number })}
          min={0}
          step="0.01"
        />
      </FormRow>
      <FormDateInput
        label="到期还款日"
        value={formData.repaymentDate || ''}
        onChange={(value) => onChange({ ...formData, repaymentDate: value })}
      />
      <FormTextarea
        label="备注"
        value={formData.notes || ''}
        onChange={(value) => onChange({ ...formData, notes: value })}
      />
    </>
  );
}
