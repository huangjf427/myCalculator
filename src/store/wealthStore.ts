import { create } from 'zustand';
import type {
  AnyAsset, AnyLiability, ChangeRecord,
  AssetCategory, LiabilityCategory,
  CreateAssetInput, CreateLiabilityInput,
} from '@/types';
import { getAssetAmount, getAssetDisplayName, getLiabilityAmount, getLiabilityDisplayName } from '@/types';

const STORAGE_KEYS = {
  ASSETS: 'wealth_tracker_assets',
  LIABILITIES: 'wealth_tracker_liabilities',
  CHANGES: 'wealth_tracker_changes',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
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

interface WealthState {
  assets: AnyAsset[];
  liabilities: AnyLiability[];
  changes: ChangeRecord[];

  // 资产操作
  addAsset: (asset: CreateAssetInput) => void;
  updateAsset: (id: string, asset: Partial<AnyAsset>) => void;
  deleteAsset: (id: string) => void;

  // 负债操作
  addLiability: (liability: CreateLiabilityInput) => void;
  updateLiability: (id: string, liability: Partial<AnyLiability>) => void;
  deleteLiability: (id: string) => void;

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
  assets: loadFromStorage<AnyAsset[]>(STORAGE_KEYS.ASSETS, []),
  liabilities: loadFromStorage<AnyLiability[]>(STORAGE_KEYS.LIABILITIES, []),
  changes: loadFromStorage<ChangeRecord[]>(STORAGE_KEYS.CHANGES, []),

  addAsset: (asset) => {
    const now = new Date().toISOString();
    const newAsset = { ...asset, id: generateId(), createdAt: now, updatedAt: now } as AnyAsset;
    set((state) => {
      const assets = [...state.assets, newAsset];
      saveToStorage(STORAGE_KEYS.ASSETS, assets);
      const change: ChangeRecord = {
        id: generateId(),
        type: 'add',
        target: 'asset',
        name: getAssetDisplayName(newAsset),
        category: newAsset.category,
        amount: getAssetAmount(newAsset),
        timestamp: now,
      };
      const changes = [change, ...state.changes].slice(0, 50);
      saveToStorage(STORAGE_KEYS.CHANGES, changes);
      return { assets, changes };
    });
  },

  updateAsset: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => {
      const assets = state.assets.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: now } as AnyAsset : a
      );
      saveToStorage(STORAGE_KEYS.ASSETS, assets);
      const target = assets.find((a) => a.id === id);
      if (target) {
        const change: ChangeRecord = {
          id: generateId(),
          type: 'edit',
          target: 'asset',
          name: getAssetDisplayName(target),
          category: target.category,
          amount: getAssetAmount(target),
          timestamp: now,
        };
        const changes = [change, ...state.changes].slice(0, 50);
        saveToStorage(STORAGE_KEYS.CHANGES, changes);
        return { assets, changes };
      }
      return { assets };
    });
  },

  deleteAsset: (id) => {
    const now = new Date().toISOString();
    set((state) => {
      const target = state.assets.find((a) => a.id === id);
      const assets = state.assets.filter((a) => a.id !== id);
      saveToStorage(STORAGE_KEYS.ASSETS, assets);
      if (target) {
        const change: ChangeRecord = {
          id: generateId(),
          type: 'delete',
          target: 'asset',
          name: getAssetDisplayName(target),
          category: target.category,
          amount: getAssetAmount(target),
          timestamp: now,
        };
        const changes = [change, ...state.changes].slice(0, 50);
        saveToStorage(STORAGE_KEYS.CHANGES, changes);
        return { assets, changes };
      }
      return { assets };
    });
  },

  addLiability: (liability) => {
    const now = new Date().toISOString();
    const newLiability = { ...liability, id: generateId(), createdAt: now, updatedAt: now } as AnyLiability;
    set((state) => {
      const liabilities = [...state.liabilities, newLiability];
      saveToStorage(STORAGE_KEYS.LIABILITIES, liabilities);
      const change: ChangeRecord = {
        id: generateId(),
        type: 'add',
        target: 'liability',
        name: getLiabilityDisplayName(newLiability),
        category: newLiability.category,
        amount: getLiabilityAmount(newLiability),
        timestamp: now,
      };
      const changes = [change, ...state.changes].slice(0, 50);
      saveToStorage(STORAGE_KEYS.CHANGES, changes);
      return { liabilities, changes };
    });
  },

  updateLiability: (id, updates) => {
    const now = new Date().toISOString();
    set((state) => {
      const liabilities = state.liabilities.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: now } as AnyLiability : l
      );
      saveToStorage(STORAGE_KEYS.LIABILITIES, liabilities);
      const target = liabilities.find((l) => l.id === id);
      if (target) {
        const change: ChangeRecord = {
          id: generateId(),
          type: 'edit',
          target: 'liability',
          name: getLiabilityDisplayName(target),
          category: target.category,
          amount: getLiabilityAmount(target),
          timestamp: now,
        };
        const changes = [change, ...state.changes].slice(0, 50);
        saveToStorage(STORAGE_KEYS.CHANGES, changes);
        return { liabilities, changes };
      }
      return { liabilities };
    });
  },

  deleteLiability: (id) => {
    const now = new Date().toISOString();
    set((state) => {
      const target = state.liabilities.find((l) => l.id === id);
      const liabilities = state.liabilities.filter((l) => l.id !== id);
      saveToStorage(STORAGE_KEYS.LIABILITIES, liabilities);
      if (target) {
        const change: ChangeRecord = {
          id: generateId(),
          type: 'delete',
          target: 'liability',
          name: getLiabilityDisplayName(target),
          category: target.category,
          amount: getLiabilityAmount(target),
          timestamp: now,
        };
        const changes = [change, ...state.changes].slice(0, 50);
        saveToStorage(STORAGE_KEYS.CHANGES, changes);
        return { liabilities, changes };
      }
      return { liabilities };
    });
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
