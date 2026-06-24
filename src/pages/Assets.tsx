import { useState } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import type { AnyAsset, AssetCategory, BankDeposit, Securities, FundWealth, OtherAsset, CreateAssetInput } from '@/types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { BankDepositForm } from '@/components/forms/BankDepositForm';
import { SecuritiesForm } from '@/components/forms/SecuritiesForm';
import { FundWealthForm } from '@/components/forms/FundWealthForm';
import { OtherAssetForm } from '@/components/forms/OtherAssetForm';

export function Assets() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory>('bank_deposit');
  const [formData, setFormData] = useState<Partial<AnyAsset>>({
    category: 'bank_deposit',
  });

  const assets = useWealthStore((state) => state.assets);
  const addAsset = useWealthStore((state) => state.addAsset);
  const updateAsset = useWealthStore((state) => state.updateAsset);
  const deleteAsset = useWealthStore((state) => state.deleteAsset);

  const categoryLabels: Record<AssetCategory, string> = {
    bank_deposit: '银行存款',
    securities: '证券投资',
    fund_wealth: '理财基金',
    other_asset: '其他资产',
  };

  const handleCategoryChange = (category: AssetCategory) => {
    setSelectedCategory(category);
    setFormData({ category });
  };

  const handleAdd = (category: AssetCategory) => {
    setSelectedCategory(category);
    setFormData({ category });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (asset: AnyAsset) => {
    setSelectedCategory(asset.category);
    setFormData(asset);
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let submitData = { ...formData };

    // 银行：计算到期金额 = 金额 × (1 + 期限 × 利率)
    if (submitData.category === 'bank_deposit') {
      const term = typeof submitData.term === 'string' ? parseFloat(submitData.term) || 0 : (submitData.term || 0);
      const amount = submitData.amount || 0;
      const rate = submitData.interestRate || 0;
      submitData.maturityAmount = amount * (1 + term * rate);
    }

    // 证券、理财、其他资产：计算收益 = 现值 - 本金
    if (submitData.category === 'securities' || submitData.category === 'fund_wealth' || submitData.category === 'other_asset') {
      const principal = submitData.principal || 0;
      const currentValue = submitData.currentValue || 0;
      submitData.profit = currentValue - principal;
    }

    if (editingId) {
      updateAsset(editingId, submitData);
    } else {
      addAsset(submitData as CreateAssetInput);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ category: selectedCategory });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除这条记录吗？')) {
      deleteAsset(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const filteredAssets = assets.filter((a) => a.category === selectedCategory);

  const renderFormFields = () => {
    switch (selectedCategory) {
      case 'bank_deposit':
        return <BankDepositForm formData={formData as Partial<BankDeposit>} onChange={setFormData} />;
      case 'securities':
        return <SecuritiesForm formData={formData as Partial<Securities>} onChange={setFormData} />;
      case 'fund_wealth':
        return <FundWealthForm formData={formData as Partial<FundWealth>} onChange={setFormData} />;
      case 'other_asset':
        return <OtherAssetForm formData={formData as Partial<OtherAsset>} onChange={setFormData} />;
    }
  };

  const renderTableColumns = () => {
    switch (selectedCategory) {
      case 'bank_deposit':
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">银行名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">户名</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">定/活期</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">金额</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">存入日期</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">到期日</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
      case 'securities':
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">机构名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">户名</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">本金</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">现值</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">收益</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
      case 'fund_wealth':
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">机构名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">户名</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">产品名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">本金</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">现值</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">收益</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">到期日</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
      case 'other_asset':
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">资产名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">户名</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">产品名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">本金</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">现值</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">收益</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">到期日</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
    }
  };

  const renderTableRow = (asset: AnyAsset) => {
    switch (asset.category) {
      case 'bank_deposit': {
        const bankAsset = asset as BankDeposit;
        return (
          <tr key={asset.id} className="hover:bg-wealth-cream/50 transition-colors">
            <td className="px-6 py-4 text-wealth-text font-medium">{bankAsset.bankName}</td>
            <td className="px-6 py-4 text-wealth-text">{bankAsset.accountName}</td>
            <td className="px-6 py-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${bankAsset.depositType === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                {bankAsset.depositType === 'fixed' ? '定期' : '活期'}
              </span>
            </td>
            <td className="px-6 py-4 text-wealth-text font-semibold">{formatCurrency(bankAsset.amount)}</td>
            <td className="px-6 py-4 text-wealth-text-light">{bankAsset.depositDate}</td>
            <td className="px-6 py-4 text-wealth-text-light">{bankAsset.maturityDate || '-'}</td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleEdit(asset)} className="text-wealth-gold hover:text-wealth-gold-dark mr-3">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        );
      }
      case 'securities': {
        const securitiesAsset = asset as Securities;
        const profit = securitiesAsset.currentValue - securitiesAsset.principal;
        return (
          <tr key={asset.id} className="hover:bg-wealth-cream/50 transition-colors">
            <td className="px-6 py-4 text-wealth-text font-medium">{securitiesAsset.institution}</td>
            <td className="px-6 py-4 text-wealth-text">{securitiesAsset.accountName}</td>
            <td className="px-6 py-4 text-wealth-text">{formatCurrency(securitiesAsset.principal)}</td>
            <td className="px-6 py-4 text-wealth-text font-semibold">{formatCurrency(securitiesAsset.currentValue)}</td>
            <td className="px-6 py-4">
              <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(profit)}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleEdit(asset)} className="text-wealth-gold hover:text-wealth-gold-dark mr-3">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        );
      }
      case 'fund_wealth': {
        const fundAsset = asset as FundWealth;
        const profit = fundAsset.currentValue - fundAsset.principal;
        return (
          <tr key={asset.id} className="hover:bg-wealth-cream/50 transition-colors">
            <td className="px-6 py-4 text-wealth-text font-medium">{fundAsset.institution}</td>
            <td className="px-6 py-4 text-wealth-text">{fundAsset.accountName}</td>
            <td className="px-6 py-4 text-wealth-text">{fundAsset.productName}</td>
            <td className="px-6 py-4 text-wealth-text">{formatCurrency(fundAsset.principal)}</td>
            <td className="px-6 py-4 text-wealth-text font-semibold">{formatCurrency(fundAsset.currentValue)}</td>
            <td className="px-6 py-4">
              <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(profit)}
              </span>
            </td>
            <td className="px-6 py-4 text-wealth-text-light">{fundAsset.maturityDate || '-'}</td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleEdit(asset)} className="text-wealth-gold hover:text-wealth-gold-dark mr-3">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        );
      }
      case 'other_asset': {
        const otherAsset = asset as OtherAsset;
        const profit = otherAsset.currentValue - otherAsset.principal;
        return (
          <tr key={asset.id} className="hover:bg-wealth-cream/50 transition-colors">
            <td className="px-6 py-4 text-wealth-text font-medium">{otherAsset.assetName}</td>
            <td className="px-6 py-4 text-wealth-text">{otherAsset.accountName}</td>
            <td className="px-6 py-4 text-wealth-text">{otherAsset.productName}</td>
            <td className="px-6 py-4 text-wealth-text">{formatCurrency(otherAsset.principal)}</td>
            <td className="px-6 py-4 text-wealth-text font-semibold">{formatCurrency(otherAsset.currentValue)}</td>
            <td className="px-6 py-4">
              <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {formatCurrency(profit)}
              </span>
            </td>
            <td className="px-6 py-4 text-wealth-text-light">{otherAsset.maturityDate || '-'}</td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleEdit(asset)} className="text-wealth-gold hover:text-wealth-gold-dark mr-3">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        );
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="font-display text-3xl font-bold text-wealth-dark mb-2">资产管理</h2>
          <p className="text-wealth-text-light font-body">管理您的各类资产</p>
        </div>
      </div>

      {/* 分类标签页 */}
      <div className="bg-white rounded-xl border border-wealth-border mb-6">
        <div className="flex border-b border-wealth-border">
          {(Object.keys(categoryLabels) as AssetCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-6 py-4 font-medium transition-all ${
                selectedCategory === category
                  ? 'text-wealth-gold border-b-2 border-wealth-gold'
                  : 'text-wealth-text-light hover:text-wealth-text'
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-wealth-text-light">
              共 {filteredAssets.length} 条记录
            </div>
            <button
              onClick={() => handleAdd(selectedCategory)}
              className="gradient-gold text-white px-6 py-3 rounded-lg font-body font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              添加{categoryLabels[selectedCategory]}
            </button>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="bg-wealth-cream/50 rounded-xl p-12 border border-wealth-border text-center">
              <p className="text-wealth-text-light font-body">
                暂无{categoryLabels[selectedCategory]}记录，点击"添加"开始记录
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-wealth-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-wealth-cream">
                  <tr>{renderTableColumns()}</tr>
                </thead>
                <tbody className="divide-y divide-wealth-border">
                  {filteredAssets.map(renderTableRow)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 表单弹窗 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-2xl font-bold text-wealth-dark">
                {editingId ? '编辑' : '添加'}{categoryLabels[selectedCategory]}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="text-wealth-text-light hover:text-wealth-dark"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {renderFormFields()}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 gradient-gold text-white py-3 rounded-lg font-body font-medium hover:shadow-lg transition-all"
                >
                  {editingId ? '更新' : '添加'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="flex-1 bg-gray-100 text-wealth-text py-3 rounded-lg font-body font-medium hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
