import { useMemo } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import { getAssetAmount, getLiabilityAmount } from '@/types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

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

  // 按月汇总：资产根据存入/购买日期，负债根据开始日期
  const monthlyData = useMemo(() => {
    const assetMap = new Map<string, number>();
    const liabilityMap = new Map<string, number>();

    for (const asset of assets) {
      const date = asset.category === 'bank_deposit' ? asset.depositDate : (asset.category === 'fund_wealth' ? asset.purchaseDate : undefined);
      const month = getYearMonth(date);
      if (month) {
        assetMap.set(month, (assetMap.get(month) ?? 0) + getAssetAmount(asset));
      }
    }

    for (const liability of liabilities) {
      const date = liability.category === 'credit_card' ? liability.repaymentDate : liability.startDate;
      const month = getYearMonth(date);
      if (month) {
        liabilityMap.set(month, (liabilityMap.get(month) ?? 0) + getLiabilityAmount(liability));
      }
    }

    const months = Array.from(new Set([...assetMap.keys(), ...liabilityMap.keys()])).sort();
    return months.map((month) => ({
      month,
      资产: assetMap.get(month) ?? 0,
      负债: liabilityMap.get(month) ?? 0,
      净资产: (assetMap.get(month) ?? 0) - (liabilityMap.get(month) ?? 0),
    }));
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

      {/* 按月统计趋势 */}
      <div className="bg-white rounded-xl p-6 border border-wealth-border mb-8">
        <h3 className="font-display text-xl font-semibold text-wealth-dark mb-6">
          资产负债月度趋势
        </h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="资产" stroke="#10b981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="负债" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="净资产" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-wealth-text-light">
            暂无按月统计数据（需资产/负债填写日期）
          </div>
        )}
      </div>

      {/* 按月汇总表 */}
      <div className="bg-white rounded-xl p-6 border border-wealth-border mb-8">
        <h3 className="font-display text-xl font-semibold text-wealth-dark mb-6">
          资产负债按月汇总
        </h3>
        {monthlyData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-wealth-border">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-wealth-dark">月份</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-wealth-dark">资产总额</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-wealth-dark">负债总额</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-wealth-dark">净资产</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((row) => (
                  <tr key={row.month} className="border-b border-wealth-border/50 hover:bg-wealth-cream/30">
                    <td className="px-4 py-3 text-wealth-text">{row.month}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(row.资产)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(row.负债)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-wealth-dark">{formatCurrency(row.净资产)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-wealth-text-light">
            暂无按月汇总数据（需资产/负债填写日期）
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

// 从日期字符串中提取 YYYY-MM 月份，支持空/无效日期
function getYearMonth(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}
