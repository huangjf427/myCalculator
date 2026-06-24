import type { Securities } from '@/types';
import {
  FormInput,
  FormTextarea,
  FormReadOnlyField,
  FormRow,
} from '@/components/common';

interface SecuritiesFormProps {
  formData: Partial<Securities>;
  onChange: (data: Partial<Securities>) => void;
}

export function SecuritiesForm({ formData, onChange }: SecuritiesFormProps) {
  // 收益 = 现值 - 本金
  const principal = formData.principal || 0;
  const currentValue = formData.currentValue || 0;
  const profit = currentValue - principal;

  return (
    <>
      <FormRow>
        <FormInput
          label="机构名称"
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
          label="本金"
          type="number"
          value={formData.principal ?? 0}
          onChange={(value) => onChange({ ...formData, principal: value as number })}
          required
          min={0}
          step="0.01"
        />
        <FormInput
          label="现值"
          type="number"
          value={formData.currentValue ?? 0}
          onChange={(value) => onChange({ ...formData, currentValue: value as number })}
          required
          min={0}
          step="0.01"
        />
      </FormRow>
      <FormReadOnlyField
        label="收益（自动计算：现值 - 本金）"
        value={profit}
      />
      <input type="hidden" value={profit} readOnly />
      <FormTextarea
        label="备注"
        value={formData.notes || ''}
        onChange={(value) => onChange({ ...formData, notes: value })}
      />
    </>
  );
}
