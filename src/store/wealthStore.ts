import { create } from 'zustand';
import type {
  AnyAsset, AnyLiability, ChangeRecord,
  AssetCategory, LiabilityCategory,
  CreateAssetInput, CreateLiabilityInput,
} from '@/types';
import { getAssetAmount, getAssetDisplayName, getLiabilityAmount, getLiabilityDisplayName } from '@/types';

// 检测是否在 Electron 环境中
const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
const isElectron = !!electronAPI;

// localStorage 回退（浏览器开发模式）
const STORAGE_KEYS = {
  ASSETS: 'wealthcare_assets',
  LIABILITIES: 'wealthcare_liabilities',
  CHANGES: 'wealthcare_changes',
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
async function loadData(): Promise<{ assets: AnyAsset[]; liabilities: AnyLiability[]; changes: ChangeRecord[] }> {
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
      const changes = await electronAPI!.db.getAllChanges();
      return { assets, liabilities, changes };
    } catch (e) {
      console.error('数据库初始化失败，回退到 localStorage', e);
      return {
        assets: loadFromStorage(STORAGE_KEYS.ASSETS, []),
        liabilities: loadFromStorage(STORAGE_KEYS.LIABILITIES, []),
        changes: loadFromStorage(STORAGE_KEYS.CHANGES, []),
      };
    }
  } else {
    // 浏览器模式：使用 localStorage
    return {
      assets: loadFromStorage(STORAGE_KEYS.ASSETS, []),
      liabilities: loadFromStorage(STORAGE_KEYS.LIABILITIES, []),
      changes: loadFromStorage(STORAGE_KEYS.CHANGES, []),
    };
  }
}

interface WealthState {
  assets: AnyAsset[];
  liabilities: AnyLiability[];
  changes: ChangeRecord[];
  initialized: boolean;

  init: () => Promise<void>;
  reload: () => Promise<void>;
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
    const change: ChangeRecord = {
      id: generateId(),
      type: 'add',
      target: 'asset',
      name: getAssetDisplayName(newAsset),
      category: newAsset.category,
      amount: getAssetAmount(newAsset),
      timestamp: now,
    };

    if (isElectron) {
      await electronAPI!.db.addAsset(asset);
      await electronAPI!.db.addChange(change);
    } else {
      saveToStorage(STORAGE_KEYS.ASSETS, [...get().assets, newAsset]);
      saveToStorage(STORAGE_KEYS.CHANGES, [change, ...get().changes].slice(0, 50));
    }

    set((state) => ({
      assets: [...state.assets, newAsset],
      changes: [change, ...state.changes].slice(0, 50),
    }));
  },

  updateAsset: async (id, updates) => {
    const now = new Date().toISOString();
    const existing = get().assets.find((a) => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: now } as AnyAsset;
    const change: ChangeRecord = {
      id: generateId(),
      type: 'edit',
      target: 'asset',
      name: getAssetDisplayName(updated),
      category: updated.category,
      amount: getAssetAmount(updated),
      timestamp: now,
    };

    if (isElectron) {
      await electronAPI!.db.updateAsset(id, updates);
      await electronAPI!.db.addChange(change);
    } else {
      const assets = get().assets.map((a) => (a.id === id ? updated : a));
      saveToStorage(STORAGE_KEYS.ASSETS, assets);
      saveToStorage(STORAGE_KEYS.CHANGES, [change, ...get().changes].slice(0, 50));
    }

    set((state) => ({
      assets: state.assets.map((a) => (a.id === id ? updated : a)),
      changes: [change, ...state.changes].slice(0, 50),
    }));
  },

  deleteAsset: async (id) => {
    const now = new Date().toISOString();
    const target = get().assets.find((a) => a.id === id);
    if (!target) return;
    const change: ChangeRecord = {
      id: generateId(),
      type: 'delete',
      target: 'asset',
      name: getAssetDisplayName(target),
      category: target.category,
      amount: getAssetAmount(target),
      timestamp: now,
    };

    if (isElectron) {
      await electronAPI!.db.deleteAsset(id);
      await electronAPI!.db.addChange(change);
    } else {
      const assets = get().assets.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEYS.ASSETS, assets);
      saveToStorage(STORAGE_KEYS.CHANGES, [change, ...get().changes].slice(0, 50));
    }

    set((state) => ({
      assets: state.assets.filter((a) => a.id !== id),
      changes: [change, ...state.changes].slice(0, 50),
    }));
  },

  addLiability: async (liability) => {
    const now = new Date().toISOString();
    const newLiability = { ...liability, id: generateId(), createdAt: now, updatedAt: now } as AnyLiability;
    const change: ChangeRecord = {
      id: generateId(),
      type: 'add',
      target: 'liability',
      name: getLiabilityDisplayName(newLiability),
      category: newLiability.category,
      amount: getLiabilityAmount(newLiability),
      timestamp: now,
    };

    if (isElectron) {
      await electronAPI!.db.addLiability(liability);
      await electronAPI!.db.addChange(change);
    } else {
      saveToStorage(STORAGE_KEYS.LIABILITIES, [...get().liabilities, newLiability]);
      saveToStorage(STORAGE_KEYS.CHANGES, [change, ...get().changes].slice(0, 50));
    }

    set((state) => ({
      liabilities: [...state.liabilities, newLiability],
      changes: [change, ...state.changes].slice(0, 50),
    }));
  },

  updateLiability: async (id, updates) => {
    const now = new Date().toISOString();
    const existing = get().liabilities.find((l) => l.id === id);
    if (!existing) return;
    const updated = { ...existing, ...updates, updatedAt: now } as AnyLiability;
    const change: ChangeRecord = {
      id: generateId(),
      type: 'edit',
      target: 'liability',
      name: getLiabilityDisplayName(updated),
      category: updated.category,
      amount: getLiabilityAmount(updated),
      timestamp: now,
    };

    if (isElectron) {
      await electronAPI!.db.updateLiability(id, updates);
      await electronAPI!.db.addChange(change);
    } else {
      const liabilities = get().liabilities.map((l) => (l.id === id ? updated : l));
      saveToStorage(STORAGE_KEYS.LIABILITIES, liabilities);
      saveToStorage(STORAGE_KEYS.CHANGES, [change, ...get().changes].slice(0, 50));
    }

    set((state) => ({
      liabilities: state.liabilities.map((l) => (l.id === id ? updated : l)),
      changes: [change, ...state.changes].slice(0, 50),
    }));
  },

  deleteLiability: async (id) => {
    const now = new Date().toISOString();
    const target = get().liabilities.find((l) => l.id === id);
    if (!target) return;
    const change: ChangeRecord = {
      id: generateId(),
      type: 'delete',
      target: 'liability',
      name: getLiabilityDisplayName(target),
      category: target.category,
      amount: getLiabilityAmount(target),
      timestamp: now,
    };

    if (isElectron) {
      await electronAPI!.db.deleteLiability(id);
      await electronAPI!.db.addChange(change);
    } else {
      const liabilities = get().liabilities.filter((l) => l.id !== id);
      saveToStorage(STORAGE_KEYS.LIABILITIES, liabilities);
      saveToStorage(STORAGE_KEYS.CHANGES, [change, ...get().changes].slice(0, 50));
    }

    set((state) => ({
      liabilities: state.liabilities.filter((l) => l.id !== id),
      changes: [change, ...state.changes].slice(0, 50),
    }));
  },

  getSummary: () => {
    const { assets, liabilities } = get();
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
  },

  getAssetsByCategory: (category) => {
    return get().assets.filter((a) => a.category === category);
  },

  getLiabilitiesByCategory: (category) => {
    return get().liabilities.filter((l) => l.category === category);
  },
}));

// 全局类型声明
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      platform: string;
      db: {
        getAllAssets: () => Promise<any[]>;
        addAsset: (asset: any) => Promise<any>;
        updateAsset: (id: string, updates: any) => Promise<any>;
        deleteAsset: (id: string) => Promise<any>;
        getAllLiabilities: () => Promise<any[]>;
        addLiability: (liability: any) => Promise<any>;
        updateLiability: (id: string, updates: any) => Promise<any>;
        deleteLiability: (id: string) => Promise<any>;
        getAllChanges: () => Promise<any[]>;
        addChange: (change: any) => Promise<any>;
        migrate: (data: { assets: any[]; liabilities: any[]; changes: any[] }) => Promise<boolean>;
      };
      config: {
        getDbPath: () => Promise<string>;
        getDefaultDbPath: () => Promise<string>;
        selectFolder: () => Promise<string | null>;
        setDbPath: (dbPath: string) => Promise<{ dbPath: string }>;
      };
    };
  }
}
