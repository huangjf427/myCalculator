import type { Securities } from '@/types';

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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            机构名称 *
          </label>
          <input
            type="text"
            value={formData.institution || ''}
            onChange={(e) => onChange({ ...formData, institution: e.target.value })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            户名 *
          </label>
          <input
            type="text"
            value={formData.accountName || ''}
            onChange={(e) => onChange({ ...formData, accountName: e.target.value })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            本金 *
          </label>
          <input
            type="number"
            value={formData.principal || 0}
            onChange={(e) => onChange({ ...formData, principal: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            现值 *
          </label>
          <input
            type="number"
            value={formData.currentValue || 0}
            onChange={(e) => onChange({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-wealth-text mb-2">
          收益（自动计算：现值 - 本金）
        </label>
        <input
          type="number"
          value={profit.toFixed(2)}
          readOnly
          className={`w-full px-4 py-2 border border-wealth-border rounded-lg bg-gray-50 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}
        />
        <input
          type="hidden"
          value={profit}
          onChange={() => {}}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-wealth-text mb-2">
          备注
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => onChange({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
          rows={3}
        />
      </div>
    </>
  );
}
