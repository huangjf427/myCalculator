import type { Loan } from '@/types';
import { FormInput, FormSelect, FormDateInput, FormTextarea, FormRow } from '@/components/common';

interface LoanFormProps {
  formData: Partial<Loan>;
  onChange: (data: Partial<Loan>) => void;
}

export function LoanForm({ formData, onChange }: LoanFormProps) {
  return (
    <>
      <FormRow>
        <FormInput
          label="贷款名称"
          value={formData.loanName || ''}
          onChange={(value) => onChange({ ...formData, loanName: value as string })}
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
          label="负债金额"
          type="number"
          value={formData.liabilityAmount ?? 0}
          onChange={(value) => onChange({ ...formData, liabilityAmount: value as number })}
          required
          min={0}
          step="0.01"
        />
      </FormRow>
      <FormRow>
        <FormDateInput
          label="开始日期"
          value={formData.startDate || ''}
          onChange={(value) => onChange({ ...formData, startDate: value })}
          required
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
      <FormRow>
        <FormDateInput
          label="预期还款日"
          value={formData.expectedRepaymentDate || ''}
          onChange={(value) => onChange({ ...formData, expectedRepaymentDate: value })}
        />
        <FormSelect
          label="是否分期"
          value={formData.isInstallment ? 'yes' : 'no'}
          onChange={(value) => onChange({ ...formData, isInstallment: value === 'yes' })}
          options={[
            { value: 'no', label: '否' },
            { value: 'yes', label: '是' },
          ]}
        />
      </FormRow>
      {formData.isInstallment && (
        <FormInput
          label="每期还款金额"
          type="number"
          value={formData.installmentAmount ?? ''}
          onChange={(value) => onChange({ ...formData, installmentAmount: value as number })}
          min={0}
          step="0.01"
        />
      )}
      <FormTextarea
        label="备注"
        value={formData.notes || ''}
        onChange={(value) => onChange({ ...formData, notes: value })}
      />
    </>
  );
}
