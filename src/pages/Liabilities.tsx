import { useState } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import type { AnyLiability, LiabilityCategory, Loan, CreditCard, OtherLiability, CreateLiabilityInput } from '@/types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { LoanForm } from '@/components/forms/LoanForm';
import { CreditCardForm } from '@/components/forms/CreditCardForm';
import { OtherLiabilityForm } from '@/components/forms/OtherLiabilityForm';

export function Liabilities() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LiabilityCategory>('loan');
  const [formData, setFormData] = useState<Partial<AnyLiability>>({
    category: 'loan',
  });

  const liabilities = useWealthStore((state) => state.liabilities);
  const addLiability = useWealthStore((state) => state.addLiability);
  const updateLiability = useWealthStore((state) => state.updateLiability);
  const deleteLiability = useWealthStore((state) => state.deleteLiability);

  const categoryLabels: Record<LiabilityCategory, string> = {
    loan: '贷款',
    credit_card: '信用卡',
    other_liability: '其他负债',
  };

  const handleCategoryChange = (category: LiabilityCategory) => {
    setSelectedCategory(category);
    setFormData({ category });
  };

  const handleAdd = (category: LiabilityCategory) => {
    setSelectedCategory(category);
    setFormData({ category });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (liability: AnyLiability) => {
    setSelectedCategory(liability.category);
    setFormData(liability);
    setEditingId(liability.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateLiability(editingId, formData);
    } else {
      addLiability(formData as CreateLiabilityInput);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ category: selectedCategory });
  };

  const handleDelete = (id: string) => {
    if (confirm('确定删除这条记录吗？')) {
      deleteLiability(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const filteredLiabilities = liabilities.filter((l) => l.category === selectedCategory);

  const renderFormFields = () => {
    switch (selectedCategory) {
      case 'loan':
        return <LoanForm formData={formData as Partial<Loan>} onChange={setFormData} />;
      case 'credit_card':
        return <CreditCardForm formData={formData as Partial<CreditCard>} onChange={setFormData} />;
      case 'other_liability':
        return <OtherLiabilityForm formData={formData as Partial<OtherLiability>} onChange={setFormData} />;
    }
  };

  const renderTableColumns = () => {
    switch (selectedCategory) {
      case 'loan':
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">贷款名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">户名</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">金额</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">负债金额</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">开始日期</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">预期还款日</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
      case 'credit_card':
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">发卡机构</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">户名</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">金额</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">利率</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">到期还款日</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
      case 'other_liability':
        return (
          <>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">贷款名称</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">户名</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">金额</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">负债金额</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">开始日期</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark">预期还款日</th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
    }
  };

  const renderTableRow = (liability: AnyLiability) => {
    switch (liability.category) {
      case 'loan': {
        const loan = liability as Loan;
        return (
          <tr key={liability.id} className="hover:bg-wealth-cream/50 transition-colors">
            <td className="px-6 py-4 text-wealth-text font-medium">{loan.loanName}</td>
            <td className="px-6 py-4 text-wealth-text">{loan.accountName}</td>
            <td className="px-6 py-4 text-wealth-text">{formatCurrency(loan.amount)}</td>
            <td className="px-6 py-4 text-wealth-text font-semibold">{formatCurrency(loan.liabilityAmount)}</td>
            <td className="px-6 py-4 text-wealth-text-light">{loan.startDate}</td>
            <td className="px-6 py-4 text-wealth-text-light">{loan.expectedRepaymentDate || '-'}</td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleEdit(liability)} className="text-wealth-gold hover:text-wealth-gold-dark mr-3">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(liability.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        );
      }
      case 'credit_card': {
        const card = liability as CreditCard;
        return (
          <tr key={liability.id} className="hover:bg-wealth-cream/50 transition-colors">
            <td className="px-6 py-4 text-wealth-text font-medium">{card.institution}</td>
            <td className="px-6 py-4 text-wealth-text">{card.accountName}</td>
            <td className="px-6 py-4 text-wealth-text">{formatCurrency(card.amount)}</td>
            <td className="px-6 py-4 text-wealth-text-light">{card.interestRate ? `${card.interestRate}%` : '-'}</td>
            <td className="px-6 py-4 text-wealth-text-light">{card.repaymentDate || '-'}</td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleEdit(liability)} className="text-wealth-gold hover:text-wealth-gold-dark mr-3">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(liability.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={18} />
              </button>
            </td>
          </tr>
        );
      }
      case 'other_liability': {
        const other = liability as OtherLiability;
        return (
          <tr key={liability.id} className="hover:bg-wealth-cream/50 transition-colors">
            <td className="px-6 py-4 text-wealth-text font-medium">{other.loanName}</td>
            <td className="px-6 py-4 text-wealth-text">{other.accountName}</td>
            <td className="px-6 py-4 text-wealth-text">{formatCurrency(other.amount)}</td>
            <td className="px-6 py-4 text-wealth-text font-semibold">{formatCurrency(other.liabilityAmount)}</td>
            <td className="px-6 py-4 text-wealth-text-light">{other.startDate}</td>
            <td className="px-6 py-4 text-wealth-text-light">{other.expectedRepaymentDate || '-'}</td>
            <td className="px-6 py-4 text-right">
              <button onClick={() => handleEdit(liability)} className="text-wealth-gold hover:text-wealth-gold-dark mr-3">
                <Edit2 size={18} />
              </button>
              <button onClick={() => handleDelete(liability.id)} className="text-red-500 hover:text-red-700">
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
          <h2 className="font-display text-3xl font-bold text-wealth-dark mb-2">负债管理</h2>
          <p className="text-wealth-text-light font-body">管理您的贷款和信用卡</p>
        </div>
      </div>

      {/* 分类标签页 */}
      <div className="bg-white rounded-xl border border-wealth-border mb-6">
        <div className="flex border-b border-wealth-border">
          {(Object.keys(categoryLabels) as LiabilityCategory[]).map((category) => (
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
              共 {filteredLiabilities.length} 条记录
            </div>
            <button
              onClick={() => handleAdd(selectedCategory)}
              className="gradient-gold text-white px-6 py-3 rounded-lg font-body font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus size={20} />
              添加{categoryLabels[selectedCategory]}
            </button>
          </div>

          {filteredLiabilities.length === 0 ? (
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
                  {filteredLiabilities.map(renderTableRow)}
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
