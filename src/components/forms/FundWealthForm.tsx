import type { FundWealth } from '@/types';

interface FundWealthFormProps {
  formData: Partial<FundWealth>;
  onChange: (data: Partial<FundWealth>) => void;
}

export function FundWealthForm({ formData, onChange }: FundWealthFormProps) {
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
      <div>
        <label className="block text-sm font-medium text-wealth-text mb-2">
          产品名称 *
        </label>
        <input
          type="text"
          value={formData.productName || ''}
          onChange={(e) => onChange({ ...formData, productName: e.target.value })}
          className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            本金 *
          </label>
          <input
            type="number"
            value={formData.principal || 0}
            onChange={(e) => onChange({ ...formData, principal: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            收益 *
          </label>
          <input
            type="number"
            value={formData.profit || 0}
            onChange={(e) => onChange({ ...formData, profit: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
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
            onChange={(e) => onChange({ ...formData, currentValue: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
            min="0"
            step="0.01"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            购买日期 *
          </label>
          <input
            type="date"
            value={formData.purchaseDate || ''}
            onChange={(e) => onChange({ ...formData, purchaseDate: e.target.value })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            期限
          </label>
          <input
            type="text"
            value={formData.term || ''}
            onChange={(e) => onChange({ ...formData, term: e.target.value })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            placeholder="如：1年、3个月"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-wealth-text mb-2">
          到期日
        </label>
        <input
          type="date"
          value={formData.maturityDate || ''}
          onChange={(e) => onChange({ ...formData, maturityDate: e.target.value })}
          className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
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
