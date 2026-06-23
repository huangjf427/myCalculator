import { useMemo } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import { getAssetAmount, getLiabilityAmount } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Analysis() {
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

  const assetData = [
    { name: '银行存款', value: summary.assetBreakdown.bankDeposit, color: '#3b82f6' },
    { name: '证券投资', value: summary.assetBreakdown.securities, color: '#8b5cf6' },
    { name: '理财基金', value: summary.assetBreakdown.fundWealth, color: '#10b981' },
    { name: '其他资产', value: summary.assetBreakdown.otherAsset, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  const liabilityData = [
    { name: '贷款', value: summary.liabilityBreakdown.loan, color: '#ef4444' },
    { name: '信用卡', value: summary.liabilityBreakdown.creditCard, color: '#f97316' },
    { name: '其他负债', value: summary.liabilityBreakdown.otherLiability, color: '#ec4899' },
  ].filter(item => item.value > 0);

  const comparisonData = [
    { name: '银行存款', 金额: summary.assetBreakdown.bankDeposit },
    { name: '证券投资', 金额: summary.assetBreakdown.securities },
    { name: '理财基金', 金额: summary.assetBreakdown.fundWealth },
    { name: '其他资产', 金额: summary.assetBreakdown.otherAsset },
    { name: '贷款', 金额: summary.liabilityBreakdown.loan },
    { name: '信用卡', 金额: summary.liabilityBreakdown.creditCard },
    { name: '其他负债', 金额: summary.liabilityBreakdown.otherLiability },
  ];

  const renderCustomLabel = ({ name, percent }: { name: string; percent: number }) => {
    return `${name}: ${(percent * 100).toFixed(1)}%`;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold text-wealth-dark mb-2">
          统计分析
        </h2>
        <p className="text-wealth-text-light font-body">
          深入了解您的资产结构和财务状况
        </p>
      </div>

      {/* 关键指标 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-wealth-border">
          <h3 className="text-sm text-wealth-text-light mb-2">总资产</h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalAssets)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-wealth-border">
          <h3 className="text-sm text-wealth-text-light mb-2">总负债</h3>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalLiabilities)}
          </p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-wealth-border">
          <h3 className="text-sm text-wealth-text-light mb-2">净资产</h3>
          <p className="text-2xl font-bold text-wealth-gold">
            {formatCurrency(summary.netWorth)}
          </p>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 border border-wealth-border">
          <h3 className="font-display text-xl font-semibold text-wealth-dark mb-6">
            资产分布
          </h3>
          {assetData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-wealth-text-light">
              暂无资产数据
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 border border-wealth-border">
          <h3 className="font-display text-xl font-semibold text-wealth-dark mb-6">
            负债分布
          </h3>
          {liabilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={liabilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {liabilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-wealth-text-light">
              暂无负债数据
            </div>
          )}
        </div>
      </div>

      {/* 对比柱状图 */}
      <div className="bg-white rounded-xl p-6 border border-wealth-border mb-8">
        <h3 className="font-display text-xl font-semibold text-wealth-dark mb-6">
          资产负债对比
        </h3>
        {comparisonData.some(item => item.金额 > 0) ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="金额" fill="#c9a96e" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-wealth-text-light">
            暂无数据
          </div>
        )}
      </div>

      {/* 财务健康指标 */}
      <div className="bg-white rounded-xl p-6 border border-wealth-border">
        <h3 className="font-display text-xl font-semibold text-wealth-dark mb-6">
          财务健康指标
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-wealth-text">负债率</span>
              <span className="text-wealth-text-light">
                {(summary.debtRatio * 100).toFixed(2)}%
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  summary.debtRatio > 0.5 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(summary.debtRatio * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-wealth-text-light mt-1">
              {summary.debtRatio > 0.5 ? '负债率较高，建议控制负债' : '负债率健康'}
              （建议低于 50%）
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
