import { useMemo } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import { getAssetAmountInBase, getLiabilityAmountInBase, getAssetDisplayName, getLiabilityDisplayName } from '@/types';
import type { AnyAsset, AnyLiability } from '@/types';
import { Printer } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Line } from 'recharts';

export function Analysis() {
  const assets = useWealthStore((state) => state.assets);
  const liabilities = useWealthStore((state) => state.liabilities);
  const exchangeRates = useWealthStore((state) => state.exchangeRates);

  const summary = useMemo(() => {
    const totalAssets = assets.reduce((sum, a) => sum + getAssetAmountInBase(a, exchangeRates), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + getLiabilityAmountInBase(l, exchangeRates), 0);
    return {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      debtRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
      assetBreakdown: {
        bankDeposit: assets.filter((a) => a.category === 'bank_deposit').reduce((s, a) => s + getAssetAmountInBase(a, exchangeRates), 0),
        securities: assets.filter((a) => a.category === 'securities').reduce((s, a) => s + getAssetAmountInBase(a, exchangeRates), 0),
        fundWealth: assets.filter((a) => a.category === 'fund_wealth').reduce((s, a) => s + getAssetAmountInBase(a, exchangeRates), 0),
        otherAsset: assets.filter((a) => a.category === 'other_asset').reduce((s, a) => s + getAssetAmountInBase(a, exchangeRates), 0),
      },
      liabilityBreakdown: {
        loan: liabilities.filter((l) => l.category === 'loan').reduce((s, l) => s + getLiabilityAmountInBase(l, exchangeRates), 0),
        creditCard: liabilities.filter((l) => l.category === 'credit_card').reduce((s, l) => s + getLiabilityAmountInBase(l, exchangeRates), 0),
        otherLiability: liabilities.filter((l) => l.category === 'other_liability').reduce((s, l) => s + getLiabilityAmountInBase(l, exchangeRates), 0),
      },
    };
  }, [assets, liabilities]);

  // 按月汇总：资产按到期日（maturityDate），无到期日则归入当前月份的次月；负债按到期/还款日
  const monthlyData = useMemo(() => {
    const assetMap = new Map<string, number>();
    const liabilityMap = new Map<string, number>();
    const assetItemsMap = new Map<string, AnyAsset[]>();
    const liabilityItemsMap = new Map<string, AnyLiability[]>();

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const fallbackMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

    for (const asset of assets) {
      const date = ((asset as unknown) as { maturityDate?: string }).maturityDate;
      const month = getYearMonth(date) || fallbackMonth;
      assetMap.set(month, (assetMap.get(month) ?? 0) + getAssetAmountInBase(asset, exchangeRates));
      const list = assetItemsMap.get(month) ?? [];
      list.push(asset);
      assetItemsMap.set(month, list);
    }

    for (const liability of liabilities) {
      const date =
        liability.category === 'credit_card'
          ? liability.repaymentDate
          : ((liability as unknown) as { expectedRepaymentDate?: string }).expectedRepaymentDate;
      const month = getYearMonth(date);
      if (month) {
        liabilityMap.set(month, (liabilityMap.get(month) ?? 0) + getLiabilityAmountInBase(liability, exchangeRates));
        const list = liabilityItemsMap.get(month) ?? [];
        list.push(liability);
        liabilityItemsMap.set(month, list);
      }
    }

    const months = Array.from(new Set([...assetMap.keys(), ...liabilityMap.keys()])).sort();
    return months.map((month) => ({
      month,
      资产: assetMap.get(month) ?? 0,
      负债: liabilityMap.get(month) ?? 0,
      净资产: (assetMap.get(month) ?? 0) - (liabilityMap.get(month) ?? 0),
      assetItems: assetItemsMap.get(month) ?? [],
      liabilityItems: liabilityItemsMap.get(month) ?? [],
    }));
  }, [assets, liabilities]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const TrendTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ dataKey?: string; name?: string; value?: number; color?: string; payload?: { assetItems: AnyAsset[]; liabilityItems: AnyLiability[] } }> }) => {
    if (!active || !payload || payload.length === 0) return null;

    const item = payload[0];
    if (!item) return null;
    if (item.dataKey === '净资产') {
      return (
        <div className="bg-white p-3 border border-wealth-border rounded-lg shadow-lg">
          <p className="font-semibold text-wealth-dark mb-1">{item.name}</p>
          <p className="text-sm" style={{ color: item.color }}>
            {formatCurrency(item.value ?? 0)}
          </p>
        </div>
      );
    }

    const data = item.payload;
    const isAsset = item.dataKey === '资产';
    const items = isAsset ? data?.assetItems : data?.liabilityItems;

    return (
      <div className="bg-white p-3 border border-wealth-border rounded-lg shadow-lg max-w-xs">
        <p className="font-semibold text-wealth-dark mb-2">{item.name}</p>
        <p className="text-sm mb-2" style={{ color: item.color }}>
          合计：{formatCurrency(item.value ?? 0)}
        </p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {items?.map((it, idx) => (
            <div key={`${isAsset ? 'a' : 'l'}-${idx}`} className="flex justify-between text-xs gap-4">
              <span className="text-wealth-text truncate max-w-[140px]">
                {isAsset ? getAssetDisplayName(it as AnyAsset) : getLiabilityDisplayName(it as AnyLiability)}
              </span>
              <span className={isAsset ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(isAsset ? getAssetAmountInBase(it as AnyAsset, exchangeRates) : getLiabilityAmountInBase(it as AnyLiability, exchangeRates))}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
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

  const handlePrint = () => {
    document.body.classList.add('printing-analysis');
    window.print();
    document.body.classList.remove('printing-analysis');
  };

  return (
    <div className="analysis-page">
      <div className="mb-8 screen-only flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-wealth-dark mb-2">
            统计分析
          </h2>
          <p className="text-wealth-text-light font-body">
            深入了解您的资产结构和财务状况
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors font-medium"
        >
          <Printer size={18} />
          打印统计图表
        </button>
      </div>

      <div className="print-header hidden print:block mb-6">
        <h2 className="text-2xl font-bold text-wealth-dark">WealthCare 统计分析报表</h2>
        <p className="text-sm text-wealth-text-light">总资产：{formatCurrency(summary.totalAssets)} · 总负债：{formatCurrency(summary.totalLiabilities)} · 净资产：{formatCurrency(summary.netWorth)}</p>
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

      {/* 按到期日统计趋势 */}
      <div className="bg-white rounded-xl p-6 border border-wealth-border mb-8">
        <h3 className="font-display text-xl font-semibold text-wealth-dark mb-6">
          资产负债按到期日趋势
        </h3>
        {monthlyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip content={<TrendTooltip />} shared={false} />
              <Legend />
              <Bar dataKey="资产" fill="#10b981" name="资产" />
              <Bar dataKey="负债" fill="#ef4444" name="负债" />
              <Line type="monotone" dataKey="净资产" stroke="#3b82f6" strokeWidth={2} dot={false} name="净资产" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-wealth-text-light">
            暂无按到期日统计数据（需资产/负债填写日期）
          </div>
        )}
      </div>

      {/* 按到期日汇总表 */}
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
            暂无按到期日汇总数据（需资产/负债填写日期）
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
                className={`h-full transition-all duration-500 ${summary.debtRatio > 0.5 ? 'bg-red-500' : 'bg-green-500'
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
