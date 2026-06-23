import type { BankDeposit } from '@/types';

interface BankDepositFormProps {
  formData: Partial<BankDeposit>;
  onChange: (data: Partial<BankDeposit>) => void;
}

export function BankDepositForm({ formData, onChange }: BankDepositFormProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            银行名称 *
          </label>
          <input
            type="text"
            value={formData.bankName || ''}
            onChange={(e) => onChange({ ...formData, bankName: e.target.value })}
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
            定/活期 *
          </label>
          <select
            value={formData.depositType || 'demand'}
            onChange={(e) => onChange({ ...formData, depositType: e.target.value as 'demand' | 'fixed' })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
          >
            <option value="demand">活期</option>
            <option value="fixed">定期</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            金额 *
          </label>
          <input
            type="number"
            value={formData.amount || 0}
            onChange={(e) => onChange({ ...formData, amount: parseFloat(e.target.value) })}
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
            存入日期 *
          </label>
          <input
            type="date"
            value={formData.depositDate || ''}
            onChange={(e) => onChange({ ...formData, depositDate: e.target.value })}
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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            利率 (%)
          </label>
          <input
            type="number"
            value={formData.interestRate || ''}
            onChange={(e) => onChange({ ...formData, interestRate: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            min="0"
            step="0.01"
          />
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
      </div>
      <div>
        <label className="block text-sm font-medium text-wealth-text mb-2">
          到期金额
        </label>
        <input
          type="number"
          value={formData.maturityAmount || ''}
          onChange={(e) => onChange({ ...formData, maturityAmount: parseFloat(e.target.value) })}
          className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
          min="0"
          step="0.01"
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
