// 资产类别
export type AssetCategory = 'bank_deposit' | 'securities' | 'fund_wealth' | 'other_asset';
export type LiabilityCategory = 'loan' | 'credit_card' | 'other_liability';

// 银行存款
export interface BankDeposit {
  id: string;
  category: 'bank_deposit';
  bankName: string;        // 银行名称
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
  assetName: string;       // 资产名称
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
  institution: string;       // 发卡机构
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
  loanName: string;          // 贷款名称
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
    case 'bank_deposit': return asset.amount;
    case 'securities': return asset.currentValue;
    case 'fund_wealth': return asset.currentValue;
    case 'other_asset': return asset.currentValue;
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
    case 'loan': return liability.liabilityAmount;
    case 'credit_card': return liability.amount;
    case 'other_liability': return liability.liabilityAmount;
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

// 变动记录
export interface ChangeRecord {
  id: string;
  type: 'add' | 'edit' | 'delete';
  target: 'asset' | 'liability';
  name: string;
  category: string;
  amount: number;
  timestamp: string;
}
