import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Plus,
  Pencil,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Wallet,
  CreditCard,
  AlertTriangle,
  ArrowLeftRight,
  FileText,
} from 'lucide-react';
import { useWealthStore } from '@/store/wealthStore';
import type { ChangeRecord } from '@/types';

type OpType = 'all' | 'add' | 'edit' | 'delete';
type OpTarget = 'all' | 'asset' | 'liability';

const PAGE_SIZE = 50;

const TYPE_LABEL: Record<Exclude<OpType, 'all'>, string> = {
  add: '新增',
  edit: '修改',
  delete: '删除',
};

const CATEGORY_LABEL: Record<string, string> = {
  bank_deposit: '银行活期/定期',
  securities: '证券投资',
  fund_wealth: '理财基金',
  other_asset: '其他资产',
  loan: '贷款',
  credit_card: '信用卡',
  other_liability: '其他负债',
};

function formatAmount(n: number): string {
  return '¥' + Number(n || 0).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  } catch {
    return iso;
  }
}

export function Audit() {
  const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
  const isElectron = !!electronAPI?.db;
  const storeChanges = useWealthStore((s) => s.changes);

  const [type, setType] = useState<OpType>('all');
  const [target, setTarget] = useState<OpTarget>('all');
  const [category, setCategory] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const [page, setPage] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [records, setRecords] = useState<ChangeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 构造查询 options
  const buildOptions = useCallback(
    (offset: number) => {
      const opts: Record<string, unknown> = {
        limit: PAGE_SIZE,
        offset,
      };
      if (type !== 'all') opts.type = type;
      if (target !== 'all') opts.target = target;
      if (category !== 'all') opts.category = category;
      if (keyword.trim()) opts.keyword = keyword.trim();
      if (fromDate) opts.fromDate = new Date(fromDate).toISOString();
      if (toDate) {
        // toDate 当天结束
        const d = new Date(toDate);
        d.setHours(23, 59, 59, 999);
        opts.toDate = d.toISOString();
      }
      return opts;
    },
    [type, target, category, keyword, fromDate, toDate]
  );

  // 加载数据
  const load = useCallback(
    async (targetPage: number) => {
      if (!electronAPI?.db) {
        // 浏览器模式：fallback 到 store.changes
        let arr = storeChanges;
        if (type !== 'all') arr = arr.filter((c) => c.type === type);
        if (target !== 'all') arr = arr.filter((c) => c.target === target);
        if (category !== 'all') arr = arr.filter((c) => c.category === category);
        if (keyword.trim()) {
          const kw = keyword.trim().toLowerCase();
          arr = arr.filter(
            (c) =>
              c.name.toLowerCase().includes(kw) ||
              (c.summary || '').toLowerCase().includes(kw)
          );
        }
        setRecords(arr);
        setTotal(arr.length);
        return;
      }
      setLoading(true);
      setMessage(null);
      try {
        const offset = targetPage * PAGE_SIZE;
        const opts = buildOptions(offset);
        const [list, count] = await Promise.all([
          electronAPI.db.getAllChanges(opts),
          electronAPI.db.getChangesCount(opts),
        ]);
        setRecords(list as ChangeRecord[]);
        setTotal(count as number);
      } catch (e) {
        setMessage({ type: 'error', text: '加载操作日志失败：' + String(e) });
      } finally {
        setLoading(false);
      }
    },
    [electronAPI, storeChanges, buildOptions, type, target, category, keyword]
  );

  // 初次 & 筛选变化时重置到第 0 页
  useEffect(() => {
    setPage(0);
    setExpanded(new Set());
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, target, category, fromDate, toDate]);

  // 关键字搜索防抖
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      setExpanded(new Set());
      load(0);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // 页码变化
  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRefresh = async () => {
    await load(page);
    setMessage({ type: 'success', text: '已刷新' });
  };

  const handleReset = () => {
    setType('all');
    setTarget('all');
    setCategory('all');
    setKeyword('');
    setFromDate('');
    setToDate('');
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 类型徽章颜色
  const typeBadge = (t: ChangeRecord['type']) => {
    if (t === 'add') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (t === 'edit') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };
  const typeIcon = (t: ChangeRecord['type']) => {
    if (t === 'add') return <Plus size={12} />;
    if (t === 'edit') return <Pencil size={12} />;
    return <Trash2 size={12} />;
  };

  if (!isElectron) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold text-wealth-dark">操作审计</h2>
          <p className="text-wealth-text-light mt-1">查看对资产和负债的增、删、改操作</p>
        </div>
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              当前为浏览器模式，操作审计仅在桌面应用中可用。浏览器模式仅显示最近 200 条内存记录。
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* 标题区 */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold text-wealth-dark">操作审计</h2>
          <p className="text-wealth-text-light mt-1">
            查看对资产和负债的增、删、改等操作（截断/归档请前往
            <Link to="/logs" className="text-wealth-gold hover:underline mx-1">系统日志</Link>
            选择 audit 来源）
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors disabled:opacity-50 font-medium border border-wealth-cream-dark/30 text-sm"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* 筛选条 */}
      <section className="bg-white rounded-xl shadow-sm border border-wealth-cream p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-wealth-text-light">
            <Filter size={14} />
            <span>操作</span>
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as OpType)}
            className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
          >
            <option value="all">全部</option>
            <option value="add">新增</option>
            <option value="edit">修改</option>
            <option value="delete">删除</option>
          </select>

          <div className="flex items-center gap-1 text-sm text-wealth-text-light ml-1">
            <span>对象</span>
          </div>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as OpTarget)}
            className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
          >
            <option value="all">全部</option>
            <option value="asset">资产</option>
            <option value="liability">负债</option>
          </select>

          <div className="flex items-center gap-1 text-sm text-wealth-text-light ml-1">
            <span>类别</span>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
          >
            <option value="all">全部</option>
            {Object.entries(CATEGORY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 text-sm text-wealth-text-light ml-1">
            <span>从</span>
          </div>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
          />
          <span className="text-wealth-text-light text-sm">至</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
          />

          <div className="flex-1 min-w-[160px] relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-wealth-text-light" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="按名称或摘要搜索..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
            />
          </div>

          <button
            onClick={handleReset}
            className="px-3 py-1.5 text-sm bg-white text-wealth-text-light rounded-lg hover:bg-wealth-cream-dark/20 transition-colors border border-wealth-cream-dark/30"
          >
            重置
          </button>
        </div>
      </section>

      {/* 消息提示 */}
      {message && (
        <div
          className={`mb-3 px-4 py-2 rounded-lg text-sm flex items-start gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}
        >
          <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* 表格 */}
      <section className="bg-white rounded-xl shadow-sm border border-wealth-cream overflow-hidden">
        <div className="px-4 py-3 border-b border-wealth-cream-dark/30 bg-wealth-cream/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-wealth-dark">
            <History size={16} className="text-wealth-gold" />
            操作记录
          </div>
          <div className="text-xs text-wealth-text-light">
            共 <span className="text-wealth-text font-medium">{total}</span> 条记录 · 第 {page + 1} / {totalPages} 页
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40 text-wealth-text-light text-sm">
            <RefreshCw size={16} className="animate-spin mr-2" />
            加载中...
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-wealth-text-light text-sm">
            <FileText size={28} className="mb-2 text-wealth-cream-dark" />
            无匹配记录
          </div>
        ) : (
          <div className="divide-y divide-wealth-cream-dark/20">
            {records.map((r) => {
              const isOpen = expanded.has(r.id);
              const TargetIcon = r.target === 'asset' ? Wallet : CreditCard;
              const hasDetail = r.before != null || r.after != null || r.summary;
              return (
                <div key={r.id} className="hover:bg-wealth-cream/30">
                  <button
                    onClick={() => hasDetail && toggleExpand(r.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left"
                    disabled={!hasDetail}
                  >
                    {hasDetail ? (
                      isOpen ? (
                        <ChevronDown size={14} className="text-wealth-text-light flex-shrink-0" />
                      ) : (
                        <ChevronRight size={14} className="text-wealth-text-light flex-shrink-0" />
                      )
                    ) : (
                      <span className="w-[14px] flex-shrink-0" />
                    )}

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium flex-shrink-0 ${typeBadge(
                        r.type
                      )}`}
                    >
                      {typeIcon(r.type)}
                      {TYPE_LABEL[r.type]}
                    </span>

                    <TargetIcon size={14} className="text-wealth-gold flex-shrink-0" />

                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-wealth-dark truncate block">
                        {r.name}
                      </span>
                      {r.summary && (
                        <span className="text-xs text-wealth-text-light truncate block max-w-full">
                          {r.summary}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-wealth-text-light flex-shrink-0 hidden md:inline">
                      {CATEGORY_LABEL[r.category] || r.category}
                    </span>

                    <span className="text-sm font-mono text-wealth-text flex-shrink-0 hidden sm:inline">
                      {formatAmount(r.amount)}
                    </span>

                    <span className="text-xs text-wealth-text-light flex-shrink-0 hidden lg:inline font-mono">
                      {formatTime(r.timestamp)}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pl-12 space-y-2">
                      <div className="text-xs text-wealth-text-light lg:hidden">
                        {formatTime(r.timestamp)} · {CATEGORY_LABEL[r.category] || r.category} ·{' '}
                        <span className="font-mono">{formatAmount(r.amount)}</span>
                      </div>
                      {r.summary && (
                        <div className="text-sm text-wealth-text bg-wealth-cream/40 rounded px-3 py-2">
                          {r.summary}
                        </div>
                      )}
                      {(r.before != null || r.after != null) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div className="bg-wealth-cream/30 rounded p-2 text-xs font-mono">
                            <div className="text-wealth-text-light mb-1 flex items-center gap-1">
                              <ArrowLeftRight size={11} />
                              变更前
                            </div>
                            <pre className="whitespace-pre-wrap break-all text-wealth-text/80 overflow-auto max-h-40">
                              {r.before != null
                                ? JSON.stringify(r.before, null, 2)
                                : '（无）'}
                            </pre>
                          </div>
                          <div className="bg-wealth-cream/30 rounded p-2 text-xs font-mono">
                            <div className="text-wealth-text-light mb-1 flex items-center gap-1">
                              <ArrowLeftRight size={11} />
                              变更后
                            </div>
                            <pre className="whitespace-pre-wrap break-all text-wealth-text/80 overflow-auto max-h-40">
                              {r.after != null
                                ? JSON.stringify(r.after, null, 2)
                                : '（无）'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-wealth-cream-dark/30 bg-wealth-cream/30 flex items-center justify-between text-sm">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 bg-white border border-wealth-cream-dark/30 rounded-lg hover:bg-wealth-cream-dark/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-wealth-text-light text-xs">
              第 {page + 1} / {totalPages} 页 · 共 {total} 条
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="px-3 py-1.5 bg-white border border-wealth-cream-dark/30 rounded-lg hover:bg-wealth-cream-dark/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
