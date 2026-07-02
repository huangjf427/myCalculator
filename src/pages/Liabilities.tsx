import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useWealthStore } from '@/store/wealthStore';
import type { AnyLiability, LiabilityCategory, Loan, CreditCard, OtherLiability, CreateLiabilityInput } from '@/types';
import { Plus, Edit2, Trash2, X, Filter, RotateCcw } from 'lucide-react';
import { LoanForm } from '@/components/forms/LoanForm';
import { CreditCardForm } from '@/components/forms/CreditCardForm';
import { OtherLiabilityForm } from '@/components/forms/OtherLiabilityForm';
import { PrintableLiabilityTable } from '@/components/print/PrintableLiabilityTable';

export function Liabilities() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<LiabilityCategory>('loan');
  const [formData, setFormData] = useState<Partial<AnyLiability>>({
    category: 'loan',
  });

  // 筛选状态
  const [filterName, setFilterName] = useState('');
  const [filterAccountName, setFilterAccountName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const getDefaultSortField = (category: LiabilityCategory): string => {
    switch (category) {
      case 'loan':
      case 'other_liability':
        return 'expectedRepaymentDate';
      case 'credit_card':
        return 'repaymentDate';
    }
  };

  const [sortField, setSortField] = useState<string>(getDefaultSortField('loan'));
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    setFilterName('');
    setFilterAccountName('');
    setFilterStartDate('');
    setFilterEndDate('');
    setSortField(getDefaultSortField(category));
    setSortDirection('asc');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateLiability(editingId, formData);
    } else {
      await addLiability(formData as CreateLiabilityInput);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ category: selectedCategory });
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这条记录吗？')) {
      await deleteLiability(id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // 获取负债名称字段
  const getNameValue = (liability: AnyLiability): string => {
    switch (liability.category) {
      case 'loan': return liability.loanName;
      case 'credit_card': return liability.institution;
      case 'other_liability': return liability.loanName;
    }
  };

  const getNameLabel = (category: LiabilityCategory): string => {
    switch (category) {
      case 'loan': return '贷款名称';
      case 'credit_card': return '发卡机构';
      case 'other_liability': return '负债名称';
    }
  };

  // 获取负债用于日期筛选的字段
  const getLiabilityDateValue = (liability: AnyLiability): string | undefined => {
    switch (liability.category) {
      case 'loan': return liability.expectedRepaymentDate;
      case 'credit_card': return liability.repaymentDate;
      case 'other_liability': return liability.expectedRepaymentDate;
    }
  };

  // 日期范围匹配：无日期不过滤；只有起始则取该月及之后；只有结束则取该日及之前；都有则取月份区间
  const isDateInFilter = (dateStr: string, start: string, end: string): boolean => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return true;

    if (start && end) {
      const startMonth = new Date(start);
      startMonth.setDate(1);
      const endMonth = new Date(end);
      endMonth.setMonth(endMonth.getMonth() + 1, 0);
      return date >= startMonth && date <= endMonth;
    }

    if (start) {
      const startMonth = new Date(start);
      startMonth.setDate(1);
      return date >= startMonth;
    }

    if (end) {
      const endDate = new Date(end);
      return date <= endDate;
    }

    return true;
  };

  // 获取负债金额
  const getLiabilityAmount = (liability: AnyLiability): number => {
    switch (liability.category) {
      case 'loan': return liability.liabilityAmount ?? 0;
      case 'credit_card': return liability.amount ?? 0;
      case 'other_liability': return liability.liabilityAmount ?? 0;
    }
  };

  const filteredLiabilities = liabilities
    .filter((l) => l.category === selectedCategory)
    .filter((l) => {
      if (filterName.trim()) {
        const value = getNameValue(l) || '';
        if (!value.toLowerCase().includes(filterName.trim().toLowerCase())) return false;
      }
      if (filterAccountName.trim()) {
        if (!(l.accountName || '').toLowerCase().includes(filterAccountName.trim().toLowerCase())) return false;
      }
      const dateValue = getLiabilityDateValue(l);
      if (dateValue && !isDateInFilter(dateValue, filterStartDate, filterEndDate)) {
        return false;
      }
      return true;
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getLiabilitySortValue = (liability: AnyLiability, field: string): string | number | null | undefined => {
    switch (liability.category) {
      case 'loan': {
        const loan = liability as Loan;
        switch (field) {
          case 'loanName':
          case 'accountName':
          case 'startDate':
          case 'expectedRepaymentDate':
            return loan[field];
          case 'amount':
          case 'liabilityAmount':
            return loan[field];
          default:
            return null;
        }
      }
      case 'credit_card': {
        const card = liability as CreditCard;
        switch (field) {
          case 'institution':
          case 'accountName':
          case 'repaymentDate':
            return card[field];
          case 'amount':
          case 'interestRate':
            return card[field];
          default:
            return null;
        }
      }
      case 'other_liability': {
        const other = liability as OtherLiability;
        switch (field) {
          case 'loanName':
          case 'accountName':
          case 'startDate':
          case 'expectedRepaymentDate':
            return other[field];
          case 'amount':
          case 'liabilityAmount':
            return other[field];
          default:
            return null;
        }
      }
    }
  };

  type SortHeaderProps = {
    field: string;
    children: ReactNode;
  };

  const SortHeader = ({ field, children }: SortHeaderProps) => (
    <th
      className="px-6 py-4 text-left text-sm font-semibold text-wealth-dark"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field && (sortDirection === 'asc' ? ' ↑' : ' ↓')}
    </th>
  );

  const sortedLiabilities = useMemo(() => {
    const sorted = [...filteredLiabilities];
    sorted.sort((a, b) => {
      const aValue = getLiabilitySortValue(a, sortField);
      const bValue = getLiabilitySortValue(b, sortField);
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredLiabilities, sortField, sortDirection]);

  const hasActiveFilter =
    filterName.trim() !== '' ||
    filterAccountName.trim() !== '' ||
    filterStartDate !== '' ||
    filterEndDate !== '';

  const handleResetFilters = () => {
    setFilterName('');
    setFilterAccountName('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const totalAmount = filteredLiabilities.reduce((sum, liability) => sum + getLiabilityAmount(liability), 0);

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
            <SortHeader field="loanName">贷款名称</SortHeader>
            <SortHeader field="accountName">户名</SortHeader>
            <SortHeader field="amount">金额</SortHeader>
            <SortHeader field="liabilityAmount">负债金额</SortHeader>
            <SortHeader field="startDate">开始日期</SortHeader>
            <SortHeader field="expectedRepaymentDate">预期还款日</SortHeader>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
      case 'credit_card':
        return (
          <>
            <SortHeader field="institution">发卡机构</SortHeader>
            <SortHeader field="accountName">户名</SortHeader>
            <SortHeader field="amount">金额</SortHeader>
            <SortHeader field="interestRate">利率</SortHeader>
            <SortHeader field="repaymentDate">到期还款日</SortHeader>
            <th className="px-6 py-4 text-right text-sm font-semibold text-wealth-dark">操作</th>
          </>
        );
      case 'other_liability':
        return (
          <>
            <SortHeader field="loanName">贷款名称</SortHeader>
            <SortHeader field="accountName">户名</SortHeader>
            <SortHeader field="amount">金额</SortHeader>
            <SortHeader field="liabilityAmount">负债金额</SortHeader>
            <SortHeader field="startDate">开始日期</SortHeader>
            <SortHeader field="expectedRepaymentDate">预期还款日</SortHeader>
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
      <div className="screen-only">
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
                className={`px-6 py-4 font-medium transition-all ${selectedCategory === category
                  ? 'text-wealth-gold border-b-2 border-wealth-gold'
                  : 'text-wealth-text-light hover:text-wealth-text'
                  }`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* 筛选区域 */}
            <div className="bg-wealth-cream/30 rounded-xl p-4 mb-4 border border-wealth-border">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={16} className="text-wealth-gold" />
                <span className="text-sm font-medium text-wealth-text">筛选</span>
                {hasActiveFilter && (
                  <button
                    onClick={handleResetFilters}
                    className="ml-auto flex items-center gap-1 text-xs text-wealth-text-light hover:text-wealth-gold transition-colors"
                  >
                    <RotateCcw size={12} />
                    重置
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-wealth-text-light mb-1">{getNameLabel(selectedCategory)}</label>
                  <input
                    type="text"
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    placeholder={`输入${getNameLabel(selectedCategory)}筛选`}
                    className="w-full px-3 py-2 text-sm border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-wealth-text-light mb-1">户名</label>
                  <input
                    type="text"
                    value={filterAccountName}
                    onChange={(e) => setFilterAccountName(e.target.value)}
                    placeholder="输入户名筛选"
                    className="w-full px-3 py-2 text-sm border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-wealth-text-light mb-1">起始日期</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-wealth-text-light mb-1">结束日期</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold bg-white"
                  />
                </div>
              </div>
            </div>

            {/* 汇总区域 */}
            <div className="bg-wealth-gold/10 rounded-xl p-4 mb-4 border border-wealth-gold/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-wealth-text-light mb-1">汇总</p>
                  <p className="text-lg font-semibold text-wealth-dark">
                    共 <span className="text-wealth-gold">{filteredLiabilities.length}</span> 笔
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-wealth-text-light mb-1">金额合计</p>
                  <p className="text-xl font-bold text-wealth-dark">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-wealth-text-light">
                共 {filteredLiabilities.length} 条记录
                {hasActiveFilter && liabilities.filter((l) => l.category === selectedCategory).length !== filteredLiabilities.length && (
                  <span className="ml-1">（已筛选）</span>
                )}
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
                    {sortedLiabilities.map(renderTableRow)}
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
      <PrintableLiabilityTable />
    </div>
  );
}
