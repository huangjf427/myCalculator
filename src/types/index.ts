// 资产类别
export type AssetCategory = 'bank_deposit' | 'securities' | 'fund_wealth' | 'other_asset';
export type LiabilityCategory = 'loan' | 'credit_card' | 'other_liability';

// 银行存款
export interface BankDeposit {
  id: string;
  category: 'bank_deposit';
  bankName: string;        // 银行名称
  currency: string;        // 币种
  accountName: string;     // 户名
  depositType: 'demand' | 'fixed'; // 定/活期
  amount: number;          // 金额
  depositDate: string;     // 存入日期
  term?: string;           // 期限
  interestRate?: number;   // 利率
  maturityDate?: string;   // 到期日
  maturityAmount?: number; // 到期金额
  notes?: string;          // 备注
  createdAt: string;
  updatedAt: string;
}

// 证券投资
export interface Securities {
  id: string;
  category: 'securities';
  currency: string;        // 币种
  institution: string;     // 机构名称
  accountName: string;     // 户名
  principal: number;       // 本金
  currentValue: number;    // 现值
  profit: number;          // 收益
  notes?: string;          // 备注
  createdAt: string;
  updatedAt: string;
}

// 理财和基金
export interface FundWealth {
  id: string;
  category: 'fund_wealth';
  currency: string;        // 币种
  institution: string;     // 机构名称
  accountName: string;     // 户名
  productName: string;     // 产品名称
  principal: number;       // 本金
  purchaseDate: string;    // 购买日期
  term?: string;           // 期限
  profit: number;          // 收益
  maturityDate?: string;   // 到期日
  currentValue: number;    // 现值
  notes?: string;          // 备注
  createdAt: string;
  updatedAt: string;
}

// 其他资产
export interface OtherAsset {
  id: string;
  category: 'other_asset';
  assetName: string;
  currency: string;       // 币种
  accountName: string;     // 户名
  productName: string;     // 产品名称
  principal: number;       // 本金
  term?: string;           // 期限
  profit: number;          // 收益
  currentValue: number;    // 现值
  maturityDate?: string;   // 到期日
  notes?: string;          // 备注
  createdAt: string;
  updatedAt: string;
}

export type AnyAsset = BankDeposit | Securities | FundWealth | OtherAsset;

// 创建资产时的输入类型（不包含 id、createdAt、updatedAt）
export type CreateAssetInput =
  | Omit<BankDeposit, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<Securities, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<FundWealth, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<OtherAsset, 'id' | 'createdAt' | 'updatedAt'>;

// 贷款
export interface Loan {
  id: string;
  category: 'loan';
  loanName: string;          // 贷款名称
  currency: string;          // 币种
  accountName: string;       // 户名
  amount: number;            // 金额
  startDate: string;         // 开始日期
  liabilityAmount: number;   // 负债金额
  interestRate?: number;     // 利率
  expectedRepaymentDate?: string; // 预期还款日
  isInstallment?: boolean;   // 是否分期
  installmentAmount?: number; // 每期还款金额
  notes?: string;            // 备注
  createdAt: string;
  updatedAt: string;
}

// 信用卡
export interface CreditCard {
  id: string;
  category: 'credit_card';
  institution: string;
  currency: string;       // 币种
  accountName: string;       // 户名
  amount: number;            // 金额
  interestRate?: number;     // 利率
  repaymentDate?: string;    // 到期还款日
  notes?: string;            // 备注
  createdAt: string;
  updatedAt: string;
}

// 其他负债
export interface OtherLiability {
  id: string;
  category: 'other_liability';
  loanName: string;
  currency: string;          // 币种
  accountName: string;       // 户名
  amount: number;            // 金额
  startDate: string;         // 开始日期
  liabilityAmount: number;   // 负债金额
  interestRate?: number;     // 利率
  expectedRepaymentDate?: string; // 预期还款日
  isInstallment?: boolean;   // 是否分期
  installmentAmount?: number; // 每期还款金额
  notes?: string;            // 备注
  createdAt: string;
  updatedAt: string;
}

export type AnyLiability = Loan | CreditCard | OtherLiability;

// 创建负债时的输入类型（不包含 id、createdAt、updatedAt）
export type CreateLiabilityInput =
  | Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>
  | Omit<OtherLiability, 'id' | 'createdAt' | 'updatedAt'>;

// 获取资产的金额（用于汇总计算）
export function getAssetAmount(asset: AnyAsset): number {
  switch (asset.category) {
    case 'bank_deposit': return asset.amount ?? 0;
    case 'securities': return asset.currentValue ?? 0;
    case 'fund_wealth': return asset.currentValue ?? 0;
    case 'other_asset': return asset.currentValue ?? 0;
  }
}

// 获取资产的显示名称
export function getAssetDisplayName(asset: AnyAsset): string {
  switch (asset.category) {
    case 'bank_deposit': return asset.bankName;
    case 'securities': return asset.institution;
    case 'fund_wealth': return asset.productName;
    case 'other_asset': return asset.assetName;
  }
}

// 获取负债的金额（用于汇总计算）
export function getLiabilityAmount(liability: AnyLiability): number {
  switch (liability.category) {
    case 'loan': return liability.liabilityAmount ?? 0;
    case 'credit_card': return liability.amount ?? 0;
    case 'other_liability': return liability.liabilityAmount ?? 0;
  }
}

// 获取负债的显示名称
export function getLiabilityDisplayName(liability: AnyLiability): string {
  switch (liability.category) {
    case 'loan': return liability.loanName;
    case 'credit_card': return liability.institution;
    case 'other_liability': return liability.loanName;
  }
}

// 变动记录（操作审计）
export interface ChangeRecord {
  id: string;
  type: 'add' | 'edit' | 'delete';
  target: 'asset' | 'liability';
  name: string;
  category: string;
  amount: number;
  timestamp: string;
  summary?: string;     // 变更摘要，如 "金额 1000 → 1500"
  before?: unknown;     // 变更前快照（资产/负债对象）
  after?: unknown;      // 变更后快照
}

// ============ 多币种支持 ============

/** 基准币种，所有资产/负债汇总均以该币种（人民币）计价 */
export const BASE_CURRENCY = 'CNY';

export interface CurrencyInfo {
  code: string;
  label: string;
  symbol: string;
}

/** 支持的币种列表 */
export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'CNY', label: '人民币', symbol: '¥' },
  { code: 'USD', label: '美元', symbol: '$' },
  { code: 'HKD', label: '港币', symbol: 'HK$' },
  { code: 'EUR', label: '欧元', symbol: '€' },
  { code: 'JPY', label: '日元', symbol: '¥' },
  { code: 'GBP', label: '英镑', symbol: '£' },
  { code: 'AUD', label: '澳元', symbol: 'A$' },
  { code: 'SGD', label: '新加坡元', symbol: 'S$' },
  { code: 'CHF', label: '瑞士法郎', symbol: 'Fr' },
];

/** 各外币相对人民币的默认汇率（1 外币 = ? 人民币），可在设置中维护 */
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 7.2,
  HKD: 0.92,
  EUR: 7.8,
  JPY: 0.048,
  GBP: 9.1,
  AUD: 4.7,
  SGD: 5.3,
  CHF: 8.0,
};

export type ExchangeRates = Record<string, number>;

/** 表单下拉选项 */
export const CURRENCY_OPTIONS: { value: string; label: string }[] = SUPPORTED_CURRENCIES.map(
  (c) => ({ value: c.code, label: `${c.label}（${c.code}）` })
);

/** 获取币种中文名称，未知则返回代码 */
export function getCurrencyLabel(code: string): string {
  const found = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return found ? found.label : code || BASE_CURRENCY;
}

/**
 * 将金额转换为基准币种（人民币）金额。
 * 基准币种直接返回；未配置汇率的外币按原值计入（提示用户在设置中维护汇率）。
 */
export function toRMB(amount: number, currency: string | undefined, rates: ExchangeRates): number {
  const cur = currency || BASE_CURRENCY;
  if (cur === BASE_CURRENCY) return amount;
  const rate = rates[cur];
  if (rate == null || Number.isNaN(rate)) return amount;
  return amount * rate;
}

/** 资产按基准币种计价的金额 */
export function getAssetAmountInBase(asset: AnyAsset, rates: ExchangeRates): number {
  return toRMB(getAssetAmount(asset), asset.currency, rates);
}

/** 负债按基准币种计价的金额 */
export function getLiabilityAmountInBase(liability: AnyLiability, rates: ExchangeRates): number {
  return toRMB(getLiabilityAmount(liability), liability.currency, rates);
}

/** 按指定币种格式化金额（用于明细展示），汇总场景传入基准币种 */
export function formatMoney(value: number, currency: string = BASE_CURRENCY): string {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency || BASE_CURRENCY,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || BASE_CURRENCY}`;
  }
}
