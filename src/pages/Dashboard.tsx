import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWealthStore } from '@/store/wealthStore';
import { getAssetAmount, getLiabilityAmount } from '@/types';
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';

export function Dashboard() {
  const assets = useWealthStore((state) => state.assets);
  const liabilities = useWealthStore((state) => state.liabilities);

  const summary = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + getAssetAmount(a), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + getLiabilityAmount(l), 0);
    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
      assetBreakdown: {
        bankDeposit: assets.filter((a) => a.category === 'bank_deposit').reduce((s, a) => s + getAssetAmount(a), 0),
        securities: assets.filter((a) => a.category === 'securities').reduce((s, a) => s + getAssetAmount(a), 0),
        fundWealth: assets.filter((a) => a.category === 'fund_wealth').reduce((s, a) => s + getAssetAmount(a), 0),
        otherAsset: assets.filter((a) => a.category === 'other_asset').reduce((s, a) => s + getAssetAmount(a), 0),
      },
      liabilityBreakdown: {
        loan: liabilities.filter((l) => l.category === 'loan').reduce((s, l) => s + getLiabilityAmount(l), 0),
        creditCard: liabilities.filter((l) => l.category === 'credit_card').reduce((s, l) => s + getLiabilityAmount(l), 0),
        otherLiability: liabilities.filter((l) => l.category === 'other_liability').reduce((s, l) => s + getLiabilityAmount(l), 0),
      },
    };
  }, [assets, liabilities]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const stats = [
    {
      label: '总资产',
      value: formatCurrency(summary.totalAssets),
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: '总负债',
      value: formatCurrency(summary.totalLiabilities),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: '净资产',
      value: formatCurrency(summary.netWorth),
      icon: PiggyBank,
      color: 'text-wealth-gold',
      bgColor: 'bg-wealth-gold/10',
    },
    {
      label: '负债率',
      value: `${(summary.debtRatio * 100).toFixed(2)}%`,
      icon: TrendingUp,
      color: summary.debtRatio > 0.5 ? 'text-red-600' : 'text-green-600',
      bgColor: summary.debtRatio > 0.5 ? 'bg-red-50' : 'bg-green-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-wealth-dark mb-2">
          仪表盘
        </h2>
        <p className="text-wealth-text-light font-body">
          查看您的财务概览
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 card-hover border border-wealth-border"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-wealth-text-light font-body">
                  {stat.label}
                </span>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${stat.color} animate-count-up`}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* 资产分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-wealth-border">
          <h3 className="font-display text-xl font-semibold text-wealth-dark mb-4">
            资产分布
          </h3>
          <div className="space-y-3">
            {[
              { label: '银行存款', value: summary.assetBreakdown.bankDeposit, color: 'bg-blue-500' },
              { label: '证券投资', value: summary.assetBreakdown.securities, color: 'bg-purple-500' },
              { label: '理财基金', value: summary.assetBreakdown.fundWealth, color: 'bg-green-500' },
              { label: '其他资产', value: summary.assetBreakdown.otherAsset, color: 'bg-yellow-500' },
            ].map((item) => {
              const percentage = summary.totalAssets > 0 ? (item.value / summary.totalAssets) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-wealth-text">{item.label}</span>
                    <span className="text-wealth-text-light">
                      {formatCurrency(item.value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-wealth-border">
          <h3 className="font-display text-xl font-semibold text-wealth-dark mb-4">
            负债分布
          </h3>
          <div className="space-y-3">
            {[
              { label: '贷款', value: summary.liabilityBreakdown.loan, color: 'bg-red-500' },
              { label: '信用卡', value: summary.liabilityBreakdown.creditCard, color: 'bg-orange-500' },
              { label: '其他负债', value: summary.liabilityBreakdown.otherLiability, color: 'bg-yellow-500' },
            ].map((item) => {
              const percentage = summary.totalLiabilities > 0 ? (item.value / summary.totalLiabilities) * 100 : 0;
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-wealth-text">{item.label}</span>
                    <span className="text-wealth-text-light">
                      {formatCurrency(item.value)} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 空状态提示 */}
      {summary.totalAssets === 0 && summary.totalLiabilities === 0 && (
        <div className="bg-white rounded-xl p-12 border border-wealth-border text-center">
          <Wallet size={48} className="mx-auto text-wealth-gold/30 mb-4" />
          <h3 className="font-display text-xl font-semibold text-wealth-dark mb-2">
            开始记录您的财富
          </h3>
          <p className="text-wealth-text-light font-body mb-6">
            添加您的第一笔资产或负债，开始追踪财务状况
          </p>
          <Link
            to="/assets"
            className="inline-block gradient-gold text-white px-6 py-3 rounded-lg font-body font-medium hover:shadow-lg transition-all"
          >
            添加资产
          </Link>
        </div>
      )}
    </div>
  );
}
