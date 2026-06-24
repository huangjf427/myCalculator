import type { BankDeposit } from '@/types';
import {
  FormInput,
  FormSelect,
  FormDateInput,
  FormTextarea,
  FormReadOnlyField,
  FormRow,
} from '@/components/common';

interface BankDepositFormProps {
  formData: Partial<BankDeposit>;
  onChange: (data: Partial<BankDeposit>) => void;
}

export function BankDepositForm({ formData, onChange }: BankDepositFormProps) {
  // 到期金额 = 金额 × (1 + 期限 × 利率)
  const termValue =
    typeof formData.term === 'string' ? parseFloat(formData.term) || 0 : formData.term || 0;
  const amount = formData.amount || 0;
  const rate = formData.interestRate || 0;
  const maturityAmount = amount * (1 + termValue * rate);

  return (
    <>
      <FormRow>
        <FormInput
          label="银行名称"
          value={formData.bankName || ''}
          onChange={(value) => onChange({ ...formData, bankName: value as string })}
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
        <FormSelect
          label="定/活期"
          value={formData.depositType || 'demand'}
          onChange={(value) =>
            onChange({ ...formData, depositType: value as 'demand' | 'fixed' })
          }
          required
          options={[
            { value: 'demand', label: '活期' },
            { value: 'fixed', label: '定期' },
          ]}
        />
        <FormInput
          label="金额"
          type="number"
          value={formData.amount ?? 0}
          onChange={(value) => onChange({ ...formData, amount: value as number })}
          required
          min={0}
          step="0.01"
        />
      </FormRow>
      <FormRow>
        <FormDateInput
          label="存入日期"
          value={formData.depositDate || ''}
          onChange={(value) => onChange({ ...formData, depositDate: value })}
          required
        />
        <FormInput
          label="期限（数值，如年数）"
          type="number"
          value={termValue || ''}
          onChange={(value) => onChange({ ...formData, term: String(value) })}
          required
          min={0}
          step="0.01"
        />
      </FormRow>
      <FormRow>
        <FormInput
          label="利率 (%)"
          type="number"
          value={formData.interestRate ?? 0}
          onChange={(value) => onChange({ ...formData, interestRate: value as number })}
          required
          min={0}
          step="0.01"
        />
        <FormDateInput
          label="到期日"
          value={formData.maturityDate || ''}
          onChange={(value) => onChange({ ...formData, maturityDate: value })}
        />
      </FormRow>
      <FormReadOnlyField
        label="到期金额（自动计算：金额 × (1 + 期限 × 利率)）"
        value={maturityAmount}
      />
      <input type="hidden" value={maturityAmount} readOnly />
      <FormTextarea
        label="备注"
        value={formData.notes || ''}
        onChange={(value) => onChange({ ...formData, notes: value })}
      />
    </>
  );
}
