import type { Loan } from '@/types';

interface LoanFormProps {
  formData: Partial<Loan>;
  onChange: (data: Partial<Loan>) => void;
}

export function LoanForm({ formData, onChange }: LoanFormProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            贷款名称 *
          </label>
          <input
            type="text"
            value={formData.loanName || ''}
            onChange={(e) => onChange({ ...formData, loanName: e.target.value })}
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
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            负债金额 *
          </label>
          <input
            type="number"
            value={formData.liabilityAmount || 0}
            onChange={(e) => onChange({ ...formData, liabilityAmount: parseFloat(e.target.value) })}
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
            开始日期 *
          </label>
          <input
            type="date"
            value={formData.startDate || ''}
            onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            required
          />
        </div>
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
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            预期还款日
          </label>
          <input
            type="date"
            value={formData.expectedRepaymentDate || ''}
            onChange={(e) => onChange({ ...formData, expectedRepaymentDate: e.target.value })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            是否分期
          </label>
          <select
            value={formData.isInstallment ? 'yes' : 'no'}
            onChange={(e) => onChange({ ...formData, isInstallment: e.target.value === 'yes' })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
          >
            <option value="no">否</option>
            <option value="yes">是</option>
          </select>
        </div>
      </div>
      {formData.isInstallment && (
        <div>
          <label className="block text-sm font-medium text-wealth-text mb-2">
            每期还款金额
          </label>
          <input
            type="number"
            value={formData.installmentAmount || ''}
            onChange={(e) => onChange({ ...formData, installmentAmount: parseFloat(e.target.value) })}
            className="w-full px-4 py-2 border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold"
            min="0"
            step="0.01"
          />
        </div>
      )}
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
