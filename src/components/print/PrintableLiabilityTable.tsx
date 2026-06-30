import { useState, useMemo } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import type { AnyLiability, LiabilityCategory } from '@/types';
import { Printer, Filter, RotateCcw } from 'lucide-react';

const categoryLabels: Record<LiabilityCategory, string> = {
  loan: '贷款',
  credit_card: '信用卡',
  other_liability: '其他负债',
};

export function PrintableLiabilityTable() {
  const liabilities = useWealthStore((state) => state.liabilities);

  const [category, setCategory] = useState<LiabilityCategory>('loan');
  const [name, setName] = useState('');
  const [accountName, setAccountName] = useState('');

  const filteredLiabilities = useMemo(() => {
    return liabilities
      .filter((l) => l.category === category)
      .filter((l) => {
        if (name.trim()) {
          const value = getNameValue(l);
          if (!value.toLowerCase().includes(name.trim().toLowerCase())) return false;
        }
        if (accountName.trim()) {
          if (!(l.accountName || '').toLowerCase().includes(accountName.trim().toLowerCase())) return false;
        }
        return true;
      });
  }, [liabilities, category, name, accountName]);

  const handlePrint = () => {
    document.body.classList.add('printing-liabilities');
    window.print();
    document.body.classList.remove('printing-liabilities');
  };

  const handleReset = () => {
    setName('');
    setAccountName('');
  };

  const nameLabel = getNameLabel(category);
  const totalAmount = filteredLiabilities.reduce((sum, l) => getAmount(l) + sum, 0);

  return (
    <div className="print-section" data-print-section="liabilities">
      <div className="screen-only mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(Object.keys(categoryLabels) as LiabilityCategory[]).map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                category === c
                  ? 'bg-wealth-gold text-white'
                  : 'bg-wealth-cream text-wealth-text hover:bg-wealth-cream-dark/30'
              }`}
            >
              {categoryLabels[c]}
            </button>
          ))}
        </div>
      </div>

      <div className="screen-only mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-wealth-text-light mb-1">{nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`筛选${nameLabel}`}
            className="w-full px-3 py-2 rounded-lg border border-wealth-cream-dark/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-wealth-gold/50"
          />
        </div>
        <div>
          <label className="block text-xs text-wealth-text-light mb-1">户名</label>
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="筛选户名"
            className="w-full px-3 py-2 rounded-lg border border-wealth-cream-dark/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-wealth-gold/50"
          />
        </div>
      </div>

      <div className="screen-only mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors font-medium"
        >
          <Printer size={18} />
          打印负债明细
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors font-medium border border-wealth-cream-dark/30"
        >
          <RotateCcw size={18} />
          重置筛选
        </button>
        <span className="text-sm text-wealth-text-light flex items-center gap-1">
          <Filter size={14} />
          共 {filteredLiabilities.length} 条，合计 {formatCurrency(totalAmount)}
        </span>
      </div>

      <div className="print-header hidden print:block mb-4">
        <h2 className="text-2xl font-bold text-wealth-dark">负债明细表</h2>
        <p className="text-sm text-wealth-text-light">
          分类：{categoryLabels[category]} · 共 {filteredLiabilities.length} 条 · 合计 {formatCurrency(totalAmount)}
        </p>
      </div>

      {filteredLiabilities.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wealth-border bg-wealth-cream/50">
                {renderColumns(category)}
              </tr>
            </thead>
            <tbody>
              {filteredLiabilities.map((liability) => renderRow(liability))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-wealth-text-light screen-only">
          暂无符合条件的负债记录
        </div>
      )}
    </div>
  );
}

function getNameValue(liability: AnyLiability): string {
  switch (liability.category) {
    case 'loan': return liability.loanName;
    case 'credit_card': return liability.institution;
    case 'other_liability': return liability.loanName;
  }
}

function getNameLabel(category: LiabilityCategory): string {
  switch (category) {
    case 'loan': return '贷款名称';
    case 'credit_card': return '发卡机构';
    case 'other_liability': return '负债名称';
  }
}

function getAmount(liability: AnyLiability): number {
  switch (liability.category) {
    case 'loan': return liability.liabilityAmount ?? 0;
    case 'credit_card': return liability.amount ?? 0;
    case 'other_liability': return liability.liabilityAmount ?? 0;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(value);
}

function renderColumns(category: LiabilityCategory) {
  if (category === 'credit_card') {
    return (
      <>
        <th className="px-4 py-3 text-left font-semibold text-wealth-dark">发卡机构</th>
        <th className="px-4 py-3 text-left font-semibold text-wealth-dark">户名</th>
        <th className="px-4 py-3 text-right font-semibold text-wealth-dark">金额</th>
        <th className="px-4 py-3 text-right font-semibold text-wealth-dark">利率</th>
        <th className="px-4 py-3 text-left font-semibold text-wealth-dark">到期还款日</th>
      </>
    );
  }
  return (
    <>
      <th className="px-4 py-3 text-left font-semibold text-wealth-dark">{category === 'loan' ? '贷款名称' : '负债名称'}</th>
      <th className="px-4 py-3 text-left font-semibold text-wealth-dark">户名</th>
      <th className="px-4 py-3 text-right font-semibold text-wealth-dark">金额</th>
      <th className="px-4 py-3 text-left font-semibold text-wealth-dark">开始日期</th>
      <th className="px-4 py-3 text-right font-semibold text-wealth-dark">负债金额</th>
      <th className="px-4 py-3 text-right font-semibold text-wealth-dark">利率</th>
      <th className="px-4 py-3 text-left font-semibold text-wealth-dark">预期还款日</th>
      <th className="px-4 py-3 text-left font-semibold text-wealth-dark">分期</th>
      <th className="px-4 py-3 text-right font-semibold text-wealth-dark">每期还款</th>
    </>
  );
}

function renderRow(liability: AnyLiability) {
  if (liability.category === 'credit_card') {
    return (
      <tr key={liability.id} className="border-b border-wealth-border/50">
        <td className="px-4 py-3">{liability.institution}</td>
        <td className="px-4 py-3">{liability.accountName}</td>
        <td className="px-4 py-3 text-right">{formatCurrency(liability.amount)}</td>
        <td className="px-4 py-3 text-right">{liability.interestRate ?? 0}%</td>
        <td className="px-4 py-3">{liability.repaymentDate || '-'}</td>
      </tr>
    );
  }
  return (
    <tr key={liability.id} className="border-b border-wealth-border/50">
      <td className="px-4 py-3">{liability.loanName}</td>
      <td className="px-4 py-3">{liability.accountName}</td>
      <td className="px-4 py-3 text-right">{formatCurrency(liability.amount)}</td>
      <td className="px-4 py-3">{liability.startDate}</td>
      <td className="px-4 py-3 text-right">{formatCurrency(liability.liabilityAmount)}</td>
      <td className="px-4 py-3 text-right">{liability.interestRate ?? 0}%</td>
      <td className="px-4 py-3">{liability.expectedRepaymentDate || '-'}</td>
      <td className="px-4 py-3">{liability.isInstallment ? '是' : '否'}</td>
      <td className="px-4 py-3 text-right">{formatCurrency(liability.installmentAmount ?? 0)}</td>
    </tr>
  );
}
