import { create } from 'zustand';
import type {
  AnyAsset, AnyLiability, ChangeRecord,
  AssetCategory, LiabilityCategory,
  CreateAssetInput, CreateLiabilityInput,
} from '@/types';
import { getAssetAmount, getAssetDisplayName, getLiabilityAmount, getLiabilityDisplayName, ExchangeRates, DEFAULT_EXCHANGE_RATES, getAssetAmountInBase, getLiabilityAmountInBase } from '@/types';

// 检测是否在 Electron 环境中
const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
const isElectron = !!electronAPI;

// 比较两个对象在关注字段上的差异，返回人类可读的摘要
const AUDIT_FIELDS = [
  'amount', 'principal', 'currentValue', 'profit', 'liabilityAmount',
  'bankName', 'accountName', 'institution', 'productName', 'assetName',
  'depositType', 'interestRate', 'depositDate', 'maturityDate', 'maturityAmount',
  'term', 'repaymentDate', 'startDate', 'expectedRepaymentDate',
  'isInstallment', 'installmentAmount', 'loanName', 'notes', 'currency',
];

function diffSummary(before: Record<string, unknown>, after: Record<string, unknown>): string {
  if (!before || !after) return '';
  const parts: string[] = [];
  for (const f of AUDIT_FIELDS) {
    const bv = before[f];
    const av = after[f];
    if (bv === av) continue;
    // 跳过 undefined 在两侧都未定义的情况
    if (bv == null && av == null) continue;
    // 数字做合理比较
    const eq = typeof bv === 'number' && typeof av === 'number'
      ? Math.abs(bv - av) < 1e-9
      : bv === av;
    if (eq) continue;
    parts.push(`${f}: ${formatVal(bv)} → ${formatVal(av)}`);
    if (parts.length >= 6) {
      parts.push('…');
      break;
    }
  }
  return parts.join('，');
}

function formatVal(v: unknown): string {
  if (v == null) return '空';
  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
  if (typeof v === 'boolean') return v ? '是' : '否';
  const s = String(v);
  return s.length > 24 ? s.slice(0, 24) + '…' : s;
}

function buildAuditSummary(
  type: 'add' | 'edit' | 'delete',
  target: 'asset' | 'liability',
  name: string,
  amount: number,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>,
): string {
  const targetLabel = target === 'asset' ? '资产' : '负债';
  const amountStr = `¥${Number(amount || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`;
  if (type === 'add') {
    return `新增${targetLabel}「${name}」${amountStr}`;
  }
  if (type === 'delete') {
    return `删除${targetLabel}「${name}」${amountStr}`;
  }
  // edit
  const diff = diffSummary(before || {}, after || {});
  return diff
    ? `修改${targetLabel}「${name}」${amountStr}（${diff}）`
    : `修改${targetLabel}「${name}」${amountStr}`;
}

// 集中写入审计：changes 表（结构化）+ logger 文件（用于截断/归档）
async function writeAudit(args: {
  type: 'add' | 'edit' | 'delete';
  target: 'asset' | 'liability';
  name: string;
  category: string;
  amount: number;
  timestamp: string;
  before?: unknown;
  after?: unknown;
}): Promise<ChangeRecord> {
  const summary = buildAuditSummary(
    args.type,
    args.target,
    args.name,
    args.amount,
    args.before as Record<string, unknown> | undefined,
    args.after as Record<string, unknown> | undefined,
  );
  const change: ChangeRecord = {
    id: generateId(),
    type: args.type,
    target: args.target,
    name: args.name,
    category: args.category,
    amount: args.amount,
    timestamp: args.timestamp,
    summary,
    before: args.before,
    after: args.after,
  };
  if (isElectron) {
    try {
      await electronAPI!.db.addChange(change);
    } catch (e) {
      console.error('写入操作审计(changes)失败:', e);
    }
    // 双写到文件日志，包含变更前后的关键信息
    try {
      const loggerApi = electronAPI?.logger;
      if (loggerApi) {
        const amt = Number(args.amount || 0).toFixed(2);
        const typeLabel = args.type === 'add' ? '新增' : args.type === 'edit' ? '修改' : '删除';
        let logContent = `[${args.target}] ${typeLabel}「${args.name}」 ¥${amt}`;
        if (args.type === 'edit' && args.before && args.after) {
          const diff = diffSummary(args.before as Record<string, unknown>, args.after as Record<string, unknown>);
          if (diff) logContent += `  | 变更: ${diff}`;
        } else if (args.type === 'add' && args.after) {
          // 新增时展示完整数据（截断防止过长）
          const s = JSON.stringify(args.after);
          logContent += `  | 数据: ${s.length > 150 ? s.slice(0, 150) + '…' : s}`;
        } else if (args.type === 'delete' && args.before) {
          const s = JSON.stringify(args.before);
          logContent += `  | 快照: ${s.length > 150 ? s.slice(0, 150) + '…' : s}`;
        }
        await loggerApi.write('info', 'audit', logContent);
      }
    } catch (e) {
      console.error('写入操作审计(文件日志)失败:', e);
    }
  }
  return change;
}

// localStorage 回退（浏览器开发模式）
const STORAGE_KEYS = {
  ASSETS: 'wealthcare_assets',
  LIABILITIES: 'wealthcare_liabilities',
  CHANGES: 'wealthcare_changes',
  EXCHANGE_RATES: 'wealthcare_exchange_rates',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// 加载数据：Electron 模式从 SQLite 读取（含迁移），浏览器模式从 localStorage 读取
async function loadData(): Promise<{ assets: AnyAsset[]; liabilities: AnyLiability[]; changes: ChangeRecord[]; exchangeRates: ExchangeRates }> {
  // 浏览器模式从 localStorage 兜底读取汇率；Electron 模式下优先从 config.json 读取（见下方）
  const localRates = loadFromStorage<ExchangeRates>(STORAGE_KEYS.EXCHANGE_RATES, {});
  let exchangeRates: ExchangeRates = { ...DEFAULT_EXCHANGE_RATES, ...localRates };
  if (isElectron) {
    try {
      // 尝试从 localStorage 迁移数据到 SQLite
      const localAssets = loadFromStorage<AnyAsset[]>(STORAGE_KEYS.ASSETS, []);
      const localLiabilities = loadFromStorage<AnyLiability[]>(STORAGE_KEYS.LIABILITIES, []);
      const localChanges = loadFromStorage<ChangeRecord[]>(STORAGE_KEYS.CHANGES, []);

      if (localAssets.length > 0 || localLiabilities.length > 0) {
        const migrated = await electronAPI!.db.migrate({
          assets: localAssets,
          liabilities: localLiabilities,
          changes: localChanges,
        });
        if (migrated) {
          // 迁移成功，清理 localStorage
          localStorage.removeItem(STORAGE_KEYS.ASSETS);
          localStorage.removeItem(STORAGE_KEYS.LIABILITIES);
          localStorage.removeItem(STORAGE_KEYS.CHANGES);
        }
      }

      const assets = await electronAPI!.db.getAllAssets();
      const liabilities = await electronAPI!.db.getAllLiabilities();
      const changes = await electronAPI!.db.getAllChanges({ limit: 200 });
      // 汇率优先从 config.json 读取（与数据库同处 userData，重装/换机迁移一致）
      try {
        const stored = await electronAPI!.config.getExchangeRates();
        if (stored && Object.keys(stored).length > 0) {
          exchangeRates = { ...DEFAULT_EXCHANGE_RATES, ...stored };
        }
      } catch (e) {
        console.error('读取汇率配置失败，使用默认值', e);
      }
      return { assets, liabilities, changes, exchangeRates };
    } catch (e) {
      console.error('数据库初始化失败，回退到 localStorage', e);
        return {
          assets: loadFromStorage(STORAGE_KEYS.ASSETS, []),
          liabilities: loadFromStorage(STORAGE_KEYS.LIABILITIES, []),
          changes: loadFromStorage(STORAGE_KEYS.CHANGES, []),
          exchangeRates,
        };
    }
  } else {
    // 浏览器模式：使用 localStorage
    return {
      assets: loadFromStorage(STORAGE_KEYS.ASSETS, []),
      liabilities: loadFromStorage(STORAGE_KEYS.LIABILITIES, []),
      changes: loadFromStorage(STORAGE_KEYS.CHANGES, []),
      exchangeRates,
    };
  }
}

interface WealthState {
  assets: AnyAsset[];
  liabilities: AnyLiability[];
  changes: ChangeRecord[];
  exchangeRates: ExchangeRates;
  initialized: boolean;

  init: () => Promise<void>;
  reload: () => Promise<void>;
  setExchangeRates: (rates: ExchangeRates) => void;
  // 资产操作
  addAsset: (asset: CreateAssetInput) => Promise<void>;
  updateAsset: (id: string, asset: Partial<AnyAsset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;

  // 负债操作
  addLiability: (liability: CreateLiabilityInput) => Promise<void>;
  updateLiability: (id: string, liability: Partial<AnyLiability>) => Promise<void>;
  deleteLiability: (id: string) => Promise<void>;

  // 计算
  getSummary: () => {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
    debtRatio: number;
    assetBreakdown: {
      bankDeposit: number;
      securities: number;
      fundWealth: number;
      otherAsset: number;
    };
    liabilityBreakdown: {
      loan: number;
      creditCard: number;
      otherLiability: number;
    };
  };
  getAssetsByCategory: (category: AssetCategory) => AnyAsset[];
  getLiabilitiesByCategory: (category: LiabilityCategory) => AnyLiability[];
}

export const useWealthStore = create<WealthState>((set, get) => ({
  assets: [],
  liabilities: [],
  changes: [],
  exchangeRates: { ...DEFAULT_EXCHANGE_RATES },
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    const data = await loadData();
    set({ ...data, initialized: true });
  },

  reload: async () => {
    // 切换数据库路径后重新加载数据（不执行迁移）
    const data = await loadData();
    set({ ...data });
  },

  addAsset: async (asset) => {
    const now = new Date().toISOString();
    const newAsset = { ...asset, id: generateId(), createdAt: now, updatedAt: now } as AnyAsset;
    const change = await writeAudit({
      type: 'add',
      target: 'asset',
      name: getAssetDisplayName(newAsset),
      category: newAsset.category,
      amount: getAssetAmount(newAsset),
      timestamp: now,
      after: newAsset,
    });

    if (isElectron) {
      await electronAPI!.db.addAsset(newAsset);
    } else {
      saveToStorage(STORAGE_KEYS.ASSETS, [...get().assets, newAsset]);
    }

    set((state) => ({
      assets: [...state.assets, newAsset],
      changes: [change, ...state.changes].slice(0, 200),
    }));
  },

  updateAsset: async (id, updates) => {
    const now = new Date().toISOString();
    const existing = get().assets.find((a) => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: now } as AnyAsset;
    const change = await writeAudit({
      type: 'edit',
      target: 'asset',
      name: getAssetDisplayName(updated),
      category: updated.category,
      amount: getAssetAmount(updated),
      timestamp: now,
      before: existing,
      after: updated,
    });

    if (isElectron) {
      await electronAPI!.db.updateAsset(id, updated);
    } else {
      const assets = get().assets.map((a) => (a.id === id ? updated : a));
      saveToStorage(STORAGE_KEYS.ASSETS, assets);
    }

    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? updated : a)),
      changes: [change, ...state.changes].slice(0, 200),
    }));
  },

  deleteAsset: async (id) => {
    const now = new Date().toISOString();
    const target = get().assets.find((a) => a.id === id);
    if (!target) return;
    const change = await writeAudit({
      type: 'delete',
      target: 'asset',
      name: getAssetDisplayName(target),
      category: target.category,
      amount: getAssetAmount(target),
      timestamp: now,
      before: target,
    });

    if (isElectron) {
      await electronAPI!.db.deleteAsset(id);
    } else {
      const assets = get().assets.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEYS.ASSETS, assets);
    }

    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      changes: [change, ...state.changes].slice(0, 200),
    }));
  },

  addLiability: async (liability) => {
    const now = new Date().toISOString();
    const newLiability = { ...liability, id: generateId(), createdAt: now, updatedAt: now } as AnyLiability;
    const change = await writeAudit({
      type: 'add',
      target: 'liability',
      name: getLiabilityDisplayName(newLiability),
      category: newLiability.category,
      amount: getLiabilityAmount(newLiability),
      timestamp: now,
      after: newLiability,
    });

    if (isElectron) {
      await electronAPI!.db.addLiability(newLiability);
    } else {
      saveToStorage(STORAGE_KEYS.LIABILITIES, [...get().liabilities, newLiability]);
    }

    set((state) => ({
      liabilities: [...state.liabilities, newLiability],
      changes: [change, ...state.changes].slice(0, 200),
    }));
  },

  updateLiability: async (id, updates) => {
    const now = new Date().toISOString();
    const existing = get().liabilities.find((l) => l.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: now } as AnyLiability;
    const change = await writeAudit({
      type: 'edit',
      target: 'liability',
      name: getLiabilityDisplayName(updated),
      category: updated.category,
      amount: getLiabilityAmount(updated),
      timestamp: now,
      before: existing,
      after: updated,
    });

    if (isElectron) {
      await electronAPI!.db.updateLiability(id, updated);
    } else {
      const liabilities = get().liabilities.map((l) => (l.id === id ? updated : l));
      saveToStorage(STORAGE_KEYS.LIABILITIES, liabilities);
    }

    set((state) => ({
      liabilities: state.liabilities.map((l) => (l.id === id ? updated : l)),
      changes: [change, ...state.changes].slice(0, 200),
    }));
  },

  deleteLiability: async (id) => {
    const now = new Date().toISOString();
    const target = get().liabilities.find((l) => l.id === id);
    if (!target) return;
    const change = await writeAudit({
      type: 'delete',
      target: 'liability',
      name: getLiabilityDisplayName(target),
      category: target.category,
      amount: getLiabilityAmount(target),
      timestamp: now,
      before: target,
    });

    if (isElectron) {
      await electronAPI!.db.deleteLiability(id);
    } else {
      const liabilities = get().liabilities.filter((l) => l.id !== id);
      saveToStorage(STORAGE_KEYS.LIABILITIES, liabilities);
    }

    set((state) => ({
      liabilities: state.liabilities.filter((l) => l.id !== id),
      changes: [change, ...state.changes].slice(0, 200),
    }));
  },

  setExchangeRates: (rates) => {
    set({ exchangeRates: rates });
    if (isElectron && electronAPI) {
      electronAPI.config.setExchangeRates(rates).catch((e) => console.error('保存汇率配置失败', e));
    } else {
      saveToStorage(STORAGE_KEYS.EXCHANGE_RATES, rates);
    }
  },

  getSummary: () => {
    const { assets, liabilities, exchangeRates } = get();
    // 所有汇总均以基准币种（人民币）计价，外币资产按汇率折算
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
  },

  getAssetsByCategory: (category) => {
    return get().assets.filter((a) => a.category === category);
  },

  getLiabilitiesByCategory: (category) => {
    return get().liabilities.filter((l) => l.category === category);
  },
}));
