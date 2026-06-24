import type { OtherAsset } from '@/types';
import {
  FormInput,
  FormDateInput,
  FormTextarea,
  FormReadOnlyField,
  FormRow,
} from '@/components/common';

interface OtherAssetFormProps {
  formData: Partial<OtherAsset>;
  onChange: (data: Partial<OtherAsset>) => void;
}

export function OtherAssetForm({ formData, onChange }: OtherAssetFormProps) {
  // 收益 = 现值 - 本金
  const principal = formData.principal || 0;
  const currentValue = formData.currentValue || 0;
  const profit = currentValue - principal;

  return (
    <>
      <FormRow>
        <FormInput
          label="资产名称"
          value={formData.assetName || ''}
          onChange={(value) => onChange({ ...formData, assetName: value as string })}
          required
        />
        <FormInput
          label="户名"
          value={formData.accountName || ''}
          onChange={(value) => onChange({ ...formData, accountName: value as string })}
          required
        />
      </FormRow>
      <FormInput
        label="产品名称"
        value={formData.productName || ''}
        onChange={(value) => onChange({ ...formData, productName: value as string })}
        required
      />
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
      <FormRow>
        <FormInput
          label="期限"
          value={formData.term || ''}
          onChange={(value) => onChange({ ...formData, term: value as string })}
          placeholder="如：1年、3个月"
        />
        <FormDateInput
          label="到期日"
          value={formData.maturityDate || ''}
          onChange={(value) => onChange({ ...formData, maturityDate: value })}
        />
      </FormRow>
      <FormTextarea
        label="备注"
        value={formData.notes || ''}
        onChange={(value) => onChange({ ...formData, notes: value })}
      />
    </>
  );
}
