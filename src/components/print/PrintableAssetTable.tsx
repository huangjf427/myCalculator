import { useState, useMemo } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import type { AnyAsset, AssetCategory, BankDeposit } from '@/types';
import { Printer, Filter, RotateCcw } from 'lucide-react';

const categoryLabels: Record<AssetCategory, string> = {
  bank_deposit: '银行存款',
  securities: '证券投资',
  fund_wealth: '理财基金',
  other_asset: '其他资产',
};

export function PrintableAssetTable() {
  const assets = useWealthStore((state) => state.assets);

  const [category, setCategory] = useState<AssetCategory>('bank_deposit');
  const [institution, setInstitution] = useState('');
  const [accountName, setAccountName] = useState('');
  const [depositType, setDepositType] = useState<'all' | 'fixed' | 'demand'>('all');

  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => a.category === category)
      .filter((a) => {
        if (institution.trim()) {
          const value = getInstitutionValue(a);
          if (!value.toLowerCase().includes(institution.trim().toLowerCase())) return false;
        }
        if (accountName.trim()) {
          if (!(a.accountName || '').toLowerCase().includes(accountName.trim().toLowerCase())) return false;
        }
        if (category === 'bank_deposit' && depositType !== 'all') {
          if ((a as BankDeposit).depositType !== depositType) return false;
        }
        return true;
      });
  }, [assets, category, institution, accountName, depositType]);

  const handlePrint = () => {
    document.body.classList.add('printing-assets');
    window.print();
    document.body.classList.remove('printing-assets');
  };

  const handleReset = () => {
    setInstitution('');
    setAccountName('');
    setDepositType('all');
  };

  const institutionLabel = getInstitutionLabel(category);
  const totalAmount = filteredAssets.reduce((sum, a) => getAmount(a) + sum, 0);

  return (
    <div className="print-section" data-print-section="assets">
      <div className="screen-only mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(Object.keys(categoryLabels) as AssetCategory[]).map((c) => (
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

      <div className="screen-only mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-wealth-text-light mb-1">{institutionLabel}</label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder={`筛选${institutionLabel}`}
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
        {category === 'bank_deposit' && (
          <div>
            <label className="block text-xs text-wealth-text-light mb-1">定/活期</label>
            <select
              value={depositType}
              onChange={(e) => setDepositType(e.target.value as 'all' | 'fixed' | 'demand')}
              className="w-full px-3 py-2 rounded-lg border border-wealth-cream-dark/30 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-wealth-gold/50"
            >
              <option value="all">全部</option>
              <option value="fixed">定期</option>
              <option value="demand">活期</option>
            </select>
          </div>
        )}
      </div>

      <div className="screen-only mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors font-medium"
        >
          <Printer size={18} />
          打印资产明细
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
          共 {filteredAssets.length} 条，合计 {formatCurrency(totalAmount)}
        </span>
      </div>

      <div className="print-header hidden print:block mb-4">
        <h2 className="text-2xl font-bold text-wealth-dark">资产明细表</h2>
        <p className="text-sm text-wealth-text-light">
          分类：{categoryLabels[category]} · 共 {filteredAssets.length} 条 · 合计 {formatCurrency(totalAmount)}
        </p>
      </div>

      {filteredAssets.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-wealth-border bg-wealth-cream/50">
                {renderColumns(category)}
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => renderRow(asset))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center text-wealth-text-light screen-only">
          暂无符合条件的资产记录
        </div>
      )}
    </div>
  );
}

function getInstitutionValue(asset: AnyAsset): string {
  switch (asset.category) {
    case 'bank_deposit': return asset.bankName;
    case 'securities': return asset.institution;
    case 'fund_wealth': return asset.institution;
    case 'other_asset': return asset.assetName;
  }
}

function getInstitutionLabel(category: AssetCategory): string {
  switch (category) {
    case 'bank_deposit': return '银行名称';
    case 'securities':
    case 'fund_wealth': return '机构名称';
    case 'other_asset': return '资产名称';
  }
}

function getAmount(asset: AnyAsset): number {
  switch (asset.category) {
    case 'bank_deposit': return asset.amount ?? 0;
    case 'securities': return asset.currentValue ?? 0;
    case 'fund_wealth': return asset.currentValue ?? 0;
    case 'other_asset': return asset.currentValue ?? 0;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(value);
}

function renderColumns(category: AssetCategory) {
  switch (category) {
    case 'bank_deposit':
      return (
        <>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">银行名称</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">户名</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">类型</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">金额</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">存入日期</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">到期日</th>
        </>
      );
    case 'securities':
      return (
        <>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">机构名称</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">户名</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">本金</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">现值</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">收益</th>
        </>
      );
    case 'fund_wealth':
      return (
        <>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">机构名称</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">户名</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">产品名称</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">本金</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">现值</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">收益</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">到期日</th>
        </>
      );
    case 'other_asset':
      return (
        <>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">资产名称</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">户名</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">产品名称</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">本金</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">现值</th>
          <th className="px-4 py-3 text-right font-semibold text-wealth-dark">收益</th>
          <th className="px-4 py-3 text-left font-semibold text-wealth-dark">到期日</th>
        </>
      );
  }
}

function renderRow(asset: AnyAsset) {
  switch (asset.category) {
    case 'bank_deposit': {
      const a = asset as BankDeposit;
      return (
        <tr key={asset.id} className="border-b border-wealth-border/50">
          <td className="px-4 py-3">{a.bankName}</td>
          <td className="px-4 py-3">{a.accountName}</td>
          <td className="px-4 py-3">{a.depositType === 'fixed' ? '定期' : '活期'}</td>
          <td className="px-4 py-3 text-right">{formatCurrency(a.amount)}</td>
          <td className="px-4 py-3">{a.depositDate}</td>
          <td className="px-4 py-3">{a.maturityDate || '-'}</td>
        </tr>
      );
    }
    case 'securities': {
      const profit = asset.currentValue - asset.principal;
      return (
        <tr key={asset.id} className="border-b border-wealth-border/50">
          <td className="px-4 py-3">{asset.institution}</td>
          <td className="px-4 py-3">{asset.accountName}</td>
          <td className="px-4 py-3 text-right">{formatCurrency(asset.principal)}</td>
          <td className="px-4 py-3 text-right">{formatCurrency(asset.currentValue)}</td>
          <td className={`px-4 py-3 text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(profit)}
          </td>
        </tr>
      );
    }
    case 'fund_wealth':
      return (
        <tr key={asset.id} className="border-b border-wealth-border/50">
          <td className="px-4 py-3">{asset.institution}</td>
          <td className="px-4 py-3">{asset.accountName}</td>
          <td className="px-4 py-3">{asset.productName}</td>
          <td className="px-4 py-3 text-right">{formatCurrency(asset.principal)}</td>
          <td className="px-4 py-3 text-right">{formatCurrency(asset.currentValue)}</td>
          <td className={`px-4 py-3 text-right ${asset.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(asset.profit)}
          </td>
          <td className="px-4 py-3">{asset.maturityDate || '-'}</td>
        </tr>
      );
    case 'other_asset':
      return (
        <tr key={asset.id} className="border-b border-wealth-border/50">
          <td className="px-4 py-3">{asset.assetName}</td>
          <td className="px-4 py-3">{asset.accountName}</td>
          <td className="px-4 py-3">{asset.productName}</td>
          <td className="px-4 py-3 text-right">{formatCurrency(asset.principal)}</td>
          <td className="px-4 py-3 text-right">{formatCurrency(asset.currentValue)}</td>
          <td className={`px-4 py-3 text-right ${asset.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(asset.profit)}
          </td>
          <td className="px-4 py-3">{asset.maturityDate || '-'}</td>
        </tr>
      );
  }
}
