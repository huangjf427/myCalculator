import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Scissors,
  Archive,
  Download,
  FileText,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Zap,
  ArchiveRestore,
} from 'lucide-react';

type Level = 'all' | 'info' | 'warn' | 'error';
type SourceFilter = 'all' | 'audit' | 'console' | 'logger' | 'main' | 'db' | 'process';
type Message = { type: 'success' | 'error' | 'info'; text: string } | null;

const LEVEL_MATCH = /\[(INFO|WARN|ERROR)\]/i;

function parseLevel(line: string): 'info' | 'warn' | 'error' | 'other' {
  const m = line.match(LEVEL_MATCH);
  if (!m || !m[1]) return 'other';
  const v = m[1].toUpperCase();
  if (v === 'INFO') return 'info';
  if (v === 'WARN') return 'warn';
  if (v === 'ERROR') return 'error';
  return 'other';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}`;
  } catch {
    return iso;
  }
}

// 今日实时日志的虚拟文件标识
const LIVE_KEY = '__live__';

export function Logs() {
  const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;

  const [available, setAvailable] = useState<boolean>(!!electronAPI?.logger);
  const [logDir, setLogDir] = useState<string>('');
  const [files, setFiles] = useState<LogFileInfo[]>([]);
  const [selected, setSelected] = useState<string>(LIVE_KEY); // 默认今日实时
  const [recent, setRecent] = useState<string[]>([]);

  const [content, setContent] = useState<string[]>([]);
  const [totalLines, setTotalLines] = useState<number>(0);
  const [startLine, setStartLine] = useState<number>(0);

  const [level, setLevel] = useState<Level>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [maxLines, setMaxLines] = useState<number>(500);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>(null);

  const contentRef = useRef<HTMLDivElement>(null);
  const keywordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化：读取日志目录
  useEffect(() => {
    if (!electronAPI?.logger) {
      setAvailable(false);
      return;
    }
    (async () => {
      try {
        const dir = await electronAPI.logger.getLogDir();
        setLogDir(dir);
      } catch {
        /* noop */
      }
      await refreshFiles();
      await loadRecent();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 刷新文件列表
  const refreshFiles = useCallback(async () => {
    if (!electronAPI?.logger) return;
    try {
      const list = await electronAPI.logger.listLogs();
      setFiles(list);
    } catch (e) {
      setMessage({ type: 'error', text: '读取日志列表失败：' + String(e) });
    }
  }, [electronAPI]);

  // 加载今日实时日志
  const loadRecent = useCallback(async () => {
    if (!electronAPI?.logger) return;
    try {
      const lines = await electronAPI.logger.getRecentLogs(500);
      setRecent(lines);
    } catch {
      /* noop */
    }
  }, [electronAPI]);

  // 加载选中的日志内容
  const loadContent = useCallback(
    async (silent = false) => {
      if (!electronAPI?.logger) return;
      if (selected === LIVE_KEY) {
        await loadRecent();
        return;
      }
      if (!silent) setLoading(true);
      try {
        const result = await electronAPI.logger.readLog(selected, {
          lines: maxLines,
          level,
          keyword,
          source: source === 'all' ? null : source,
        });
        setContent(result.lines);
        setTotalLines(result.totalLines);
        setStartLine(result.startLine);
      } catch (e) {
        setMessage({ type: 'error', text: '读取日志内容失败：' + String(e) });
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [electronAPI, selected, maxLines, level, source, keyword, loadRecent]
  );

  useEffect(() => {
    if (selected === LIVE_KEY) {
      loadRecent();
    } else {
      loadContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, maxLines, level, source]);

  // 关键字搜索防抖
  useEffect(() => {
    if (selected === LIVE_KEY) return;
    if (keywordTimer.current) clearTimeout(keywordTimer.current);
    keywordTimer.current = setTimeout(() => {
      loadContent();
    }, 350);
    return () => {
      if (keywordTimer.current) clearTimeout(keywordTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  // 手动刷新
  const handleRefresh = async () => {
    if (!electronAPI?.logger) return;
    setRefreshing(true);
    setMessage(null);
    try {
      await refreshFiles();
      if (selected === LIVE_KEY) {
        await loadRecent();
      } else {
        await loadContent(true);
      }
      setMessage({ type: 'success', text: '已刷新' });
    } finally {
      setRefreshing(false);
    }
  };

  // 截断日志
  const handleTruncate = async () => {
    if (!electronAPI?.logger) return;
    if (selected === LIVE_KEY) {
      setMessage({ type: 'error', text: '今日实时日志为内存数据，无需截断。请选择具体日志文件。' });
      return;
    }
    const input = window.prompt('截断后将只保留最近 N 行，请输入保留行数：', '200');
    if (input === null) return;
    const keep = parseInt(input, 10);
    if (isNaN(keep) || keep < 0) {
      setMessage({ type: 'error', text: '请输入有效的非负整数。' });
      return;
    }
    if (!window.confirm(`确定截断该日志文件吗？将只保留最近 ${keep} 行，其余将被删除。`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await electronAPI.logger.truncateLog(selected, keep);
      setMessage({
        type: 'success',
        text: `已截断 ${result.file}：原 ${result.originalLines} 行 → 保留 ${result.keptLines} 行`,
      });
      await refreshFiles();
      await loadContent(true);
    } catch (e) {
      setMessage({ type: 'error', text: '截断失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  // 归档日志
  const handleArchive = async () => {
    if (!electronAPI?.logger) return;
    if (selected === LIVE_KEY) {
      setMessage({ type: 'error', text: '今日实时日志为内存数据，无法归档。请选择具体日志文件。' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await electronAPI.logger.archiveLog(selected);
      setMessage({
        type: 'success',
        text: `已归档 ${result.source} → ${result.archiveName}`,
      });
      await refreshFiles();
    } catch (e) {
      setMessage({ type: 'error', text: '归档失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  // 归档全部
  const handleArchiveAll = async () => {
    if (!electronAPI?.logger) return;
    if (!window.confirm('确定归档当前所有日志文件吗？每个文件都会复制一份到 archive 目录。')) return;
    setLoading(true);
    setMessage(null);
    try {
      const archived = await electronAPI.logger.archiveAllLogs();
      setMessage({
        type: 'success',
        text: `已归档 ${archived.length} 个日志文件到 archive 目录`,
      });
      await refreshFiles();
    } catch (e) {
      setMessage({ type: 'error', text: '归档全部失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  // 提取/导出单个日志
  const handleExtract = async () => {
    if (!electronAPI?.logger) return;
    if (selected === LIVE_KEY) {
      setMessage({ type: 'error', text: '今日实时日志为内存数据，无法导出。请选择具体日志文件。' });
      return;
    }
    const defaultName = selected.split(/[\\/]/).pop() || 'wealthcare.log';
    const target = await electronAPI.logger.selectSavePath(defaultName);
    if (!target) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await electronAPI.logger.extractLog(selected, target);
      setMessage({
        type: 'success',
        text: `已导出到：${result.targetPath}（${formatSize(result.size)}）`,
      });
    } catch (e) {
      setMessage({ type: 'error', text: '导出失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  // 导出全部日志为汇总文件
  const handleExtractAll = async () => {
    if (!electronAPI?.logger) return;
    if (files.length === 0) {
      setMessage({ type: 'info', text: '没有可导出的日志文件。' });
      return;
    }
    const target = await electronAPI.logger.selectSavePath(
      `wealthcare-logs-${new Date().toISOString().slice(0, 10)}.log`
    );
    if (!target) return;
    setLoading(true);
    setMessage(null);
    try {
      const paths = files.map((f) => f.path);
      const result = await electronAPI.logger.extractLogsAsBundle(paths, target);
      setMessage({
        type: 'success',
        text: `已导出 ${result.fileCount} 个日志文件到：${result.targetPath}（${formatSize(result.size)}）`,
      });
    } catch (e) {
      setMessage({ type: 'error', text: '导出汇总失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  // 当前显示的行（今日实时 vs 文件）
  const displayLines = useMemo(() => {
    if (selected === LIVE_KEY) {
      let arr = recent;
      if (source !== 'all') {
        const tag = '[' + source.toLowerCase() + ']';
        arr = arr.filter((l) => l.toLowerCase().includes(tag));
      }
      if (keyword) {
        const kw = keyword.toLowerCase();
        arr = arr.filter((l) => l.toLowerCase().includes(kw));
      }
      if (level !== 'all') {
        arr = arr.filter((l) => parseLevel(l) === level);
      }
      return arr;
    }
    return content;
  }, [selected, recent, content, keyword, level, source]);

  // 统计
  const stats = useMemo(() => {
    const target = selected === LIVE_KEY ? recent : content;
    let info = 0,
      warn = 0,
      err = 0;
    for (const l of target) {
      const lv = parseLevel(l);
      if (lv === 'info') info++;
      else if (lv === 'warn') warn++;
      else if (lv === 'error') err++;
    }
    return { info, warn, err, total: target.length };
  }, [selected, recent, content]);

  const selectedFile = files.find((f) => f.path === selected);

  if (!available) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold text-wealth-dark">系统日志</h2>
          <p className="text-wealth-text-light mt-1">查看、截断、归档与导出应用运行日志</p>
        </div>
        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              当前为浏览器模式，日志功能仅在桌面应用中可用。
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
          <h2 className="font-display text-3xl font-bold text-wealth-dark">系统日志</h2>
          <p className="text-wealth-text-light mt-1">查看、截断、归档与导出应用运行日志</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors disabled:opacity-50 font-medium border border-wealth-cream-dark/30 text-sm"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          刷新
        </button>
      </div>

      {/* 日志目录 */}
      <section className="bg-white rounded-xl shadow-sm border border-wealth-cream p-4 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <HardDrive size={16} className="text-wealth-gold flex-shrink-0" />
          <span className="text-wealth-text-light">日志目录：</span>
          <code className="px-2 py-0.5 bg-wealth-cream rounded text-xs text-wealth-text font-mono break-all">
            {logDir || '加载中...'}
          </code>
        </div>
      </section>

      <div className="flex gap-4" style={{ minHeight: '600px' }}>
        {/* 左侧：文件列表 */}
        <aside className="w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-wealth-cream overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-wealth-cream-dark/30 bg-wealth-cream/50">
            <div className="flex items-center gap-2 text-sm font-semibold text-wealth-dark">
              <FileText size={16} className="text-wealth-gold" />
              日志文件
            </div>
            <div className="text-xs text-wealth-text-light mt-0.5">共 {files.length} 个文件</div>
          </div>
          <div className="flex-1 overflow-auto">
            {/* 今日实时 */}
            <button
              onClick={() => setSelected(LIVE_KEY)}
              className={`w-full text-left px-4 py-3 border-b border-wealth-cream-dark/20 transition-colors ${
                selected === LIVE_KEY
                  ? 'bg-wealth-gold/10 border-l-2 border-l-wealth-gold'
                  : 'hover:bg-wealth-cream/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-wealth-gold flex-shrink-0" />
                <span className="text-sm font-medium text-wealth-dark truncate">今日实时</span>
              </div>
              <div className="text-xs text-wealth-text-light mt-1 ml-5">内存最近 {recent.length} 条</div>
            </button>
            {files.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-wealth-text-light">
                暂无日志文件
              </div>
            )}
            {files.map((f) => {
              const active = selected === f.path;
              return (
                <button
                  key={f.path}
                  onClick={() => setSelected(f.path)}
                  className={`w-full text-left px-4 py-3 border-b border-wealth-cream-dark/20 transition-colors ${
                    active
                      ? 'bg-wealth-gold/10 border-l-2 border-l-wealth-gold'
                      : 'hover:bg-wealth-cream/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {f.archive ? (
                      <ArchiveRestore size={14} className="text-wealth-text-light flex-shrink-0" />
                    ) : (
                      <FileText size={14} className="text-wealth-gold flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-wealth-dark truncate flex-1">
                      {f.name}
                    </span>
                  </div>
                  <div className="text-xs text-wealth-text-light mt-1 ml-5 flex items-center gap-2">
                    <span>{formatSize(f.size)}</span>
                    <span>·</span>
                    <span>{formatTime(f.mtime)}</span>
                  </div>
                  {f.archive && (
                    <div className="text-xs text-wealth-gold mt-1 ml-5">已归档</div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* 右侧：内容区 */}
        <section className="flex-1 bg-white rounded-xl shadow-sm border border-wealth-cream overflow-hidden flex flex-col">
          {/* 工具栏 */}
          <div className="px-4 py-3 border-b border-wealth-cream-dark/30 bg-wealth-cream/30">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-sm text-wealth-text-light">
                <Filter size={14} />
                <span className="hidden sm:inline">级别</span>
              </div>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as Level)}
                className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
              >
                <option value="all">全部</option>
                <option value="info">INFO 及以上</option>
                <option value="warn">WARN 及以上</option>
                <option value="error">仅 ERROR</option>
              </select>

              <div className="flex items-center gap-1 text-sm text-wealth-text-light ml-2">
                <span className="hidden sm:inline">来源</span>
              </div>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as SourceFilter)}
                className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
              >
                <option value="all">全部</option>
                <option value="audit">只看审计 (audit)</option>
                <option value="console">只看控制台 (console)</option>
                <option value="main">主进程 (main)</option>
                <option value="db">数据库 (db)</option>
                <option value="logger">日志自身 (logger)</option>
                <option value="process">异常 (process)</option>
              </select>

              <div className="flex items-center gap-1 text-sm text-wealth-text-light ml-2">
                <span className="hidden sm:inline">行数</span>
              </div>
              <select
                value={maxLines}
                onChange={(e) => setMaxLines(parseInt(e.target.value, 10))}
                disabled={selected === LIVE_KEY}
                className="px-2 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30 disabled:opacity-50"
              >
                <option value={200}>最近 200 行</option>
                <option value={500}>最近 500 行</option>
                <option value={1000}>最近 1000 行</option>
                <option value={5000}>最近 5000 行</option>
              </select>

              <div className="flex-1 min-w-[140px] relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-wealth-text-light" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="关键字过滤..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-white border border-wealth-cream-dark/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold/30"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                onClick={handleTruncate}
                disabled={loading || selected === LIVE_KEY}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-wealth-text rounded-lg hover:bg-wealth-cream-dark/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium border border-wealth-cream-dark/40 text-xs"
                title="保留最近 N 行，删除前面内容"
              >
                <Scissors size={13} />
                截断
              </button>
              <button
                onClick={handleArchive}
                disabled={loading || selected === LIVE_KEY}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-wealth-text rounded-lg hover:bg-wealth-cream-dark/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium border border-wealth-cream-dark/40 text-xs"
                title="复制到 archive 目录"
              >
                <Archive size={13} />
                归档
              </button>
              <button
                onClick={handleArchiveAll}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-wealth-text rounded-lg hover:bg-wealth-cream-dark/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium border border-wealth-cream-dark/40 text-xs"
                title="归档全部日志文件"
              >
                <ArchiveRestore size={13} />
                归档全部
              </button>
              <button
                onClick={handleExtract}
                disabled={loading || selected === LIVE_KEY}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs"
                title="导出当前日志到指定位置"
              >
                <Download size={13} />
                导出当前
              </button>
              <button
                onClick={handleExtractAll}
                disabled={loading || files.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs"
                title="将所有日志合并导出为单个文件"
              >
                <Download size={13} />
                导出全部
              </button>

              <div className="ml-auto flex items-center gap-3 text-xs text-wealth-text-light">
                <span>
                  显示 <span className="text-wealth-text font-medium">{displayLines.length}</span>
                  {selected !== LIVE_KEY && (
                    <> / 共 <span className="text-wealth-text font-medium">{totalLines}</span> 行</>
                  )}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-wealth-text-light/50" />
                  {stats.info}
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 ml-1" />
                  {stats.warn}
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 ml-1" />
                  {stats.err}
                </span>
              </div>
            </div>
          </div>

          {/* 消息提示 */}
          {message && (
            <div
              className={`mx-4 mt-3 px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              ) : (
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              )}
              <span className="break-all">{message.text}</span>
            </div>
          )}

          {/* 内容 */}
          <div className="flex-1 overflow-auto bg-wealth-dark/95" ref={contentRef}>
            {loading ? (
              <div className="flex items-center justify-center h-full text-white/60 text-sm">
                <Loader2 size={16} className="animate-spin mr-2" />
                加载中...
              </div>
            ) : displayLines.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                无日志记录
              </div>
            ) : (
              <pre className="text-xs font-mono leading-relaxed p-3 text-white/90">
                {selected !== LIVE_KEY && startLine > 0 && (
                  <div className="text-white/30 mb-1">... 省略前 {startLine} 行 ...</div>
                )}
                {displayLines.map((line, i) => {
                  const lv = parseLevel(line);
                  const color =
                    lv === 'error'
                      ? 'text-red-300'
                      : lv === 'warn'
                      ? 'text-amber-300'
                      : lv === 'info'
                      ? 'text-emerald-200/90'
                      : 'text-white/70';
                  const num = selected === LIVE_KEY
                    ? i + 1
                    : startLine + i + 1;
                  return (
                    <div key={i} className="flex hover:bg-white/5">
                      <span className="text-white/30 select-none pr-3 text-right flex-shrink-0" style={{ minWidth: '3.5rem' }}>
                        {num}
                      </span>
                      <span className={color + ' whitespace-pre-wrap break-all flex-1'}>{line || ' '}</span>
                    </div>
                  );
                })}
              </pre>
            )}
          </div>

          {/* 底部状态 */}
          <div className="px-4 py-2 border-t border-wealth-cream-dark/30 bg-wealth-cream/30 text-xs text-wealth-text-light flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ScrollText size={12} />
              {selected === LIVE_KEY
                ? '今日实时日志（内存）'
                : selectedFile
                ? `${selectedFile.name}${selectedFile.archive ? ' · 已归档' : ''}`
                : '未选择文件'}
            </span>
            <span>共 {files.length} 个日志文件</span>
          </div>
        </section>
      </div>

      {/* 说明 */}
      <section className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold mb-1">功能说明</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li><b>查看</b>：左侧选择日志文件或「今日实时」，支持级别过滤与关键字搜索。</li>
              <li><b>截断</b>：保留最近 N 行，删除前面内容（操作前请确认）。</li>
              <li><b>归档</b>：将日志复制到 archive 目录并加时间戳，原文件保留。</li>
              <li><b>提取</b>：导出单个日志或汇总所有日志到指定位置。</li>
              <li>日志按日期分文件存储，单文件超过 5MB 自动轮转归档。</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
