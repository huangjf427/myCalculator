import { useEffect, useState } from 'react';
import { FolderOpen, RotateCcw, Database, AlertTriangle, CheckCircle2, Upload, Download, ScrollText, DollarSign } from 'lucide-react';
import { useWealthStore } from '@/store/wealthStore';
import { SUPPORTED_CURRENCIES, DEFAULT_EXCHANGE_RATES } from '@/types';

export function Settings() {
  const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
  const reload = useWealthStore((s) => s.reload);
  const exchangeRates = useWealthStore((s) => s.exchangeRates);
  const setExchangeRates = useWealthStore((s) => s.setExchangeRates);
  const [rates, setRates] = useState<Record<string, number>>(() => ({ ...DEFAULT_EXCHANGE_RATES, ...exchangeRates }));
  const [rateMessage, setRateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [dbPath, setDbPath] = useState<string>('');
  const [defaultDbPath, setDefaultDbPath] = useState<string>('');
  const [logDir, setLogDir] = useState<string>('');
  const [defaultLogDir, setDefaultLogDir] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!electronAPI) {
      setMessage({ type: 'info', text: '数据库与日志位置设置仅在桌面应用中可用，汇率设置可直接在此维护。' });
      return;
    }
    (async () => {
      try {
        const current = await electronAPI.config.getDbPath();
        const def = await electronAPI.config.getDefaultDbPath();
        setDbPath(current);
        setDefaultDbPath(def);
        const currentLog = await electronAPI.config.getLogDir();
        const defLog = await electronAPI.config.getDefaultLogDir();
        setLogDir(currentLog);
        setDefaultLogDir(defLog);
      } catch (e) {
        setMessage({ type: 'error', text: '读取配置失败：' + String(e) });
      }
    })();
  }, [electronAPI]);

  const handleSelectFolder = async () => {
    if (!electronAPI) return;
    setLoading(true);
    setMessage(null);
    try {
      const folder = await electronAPI.config.selectFolder();
      if (!folder) {
        setLoading(false);
        return;
      }
      const newDbPath = folder.replace(/[\\/]+$/, '') + '\\WealthCare.db';
      await electronAPI.config.setDbPath(newDbPath);
      setDbPath(newDbPath);
      await reload();
      setMessage({
        type: 'success',
        text: '数据库位置已切换。新位置的数据库文件已加载，原数据未自动迁移。',
      });
    } catch (e) {
      setMessage({ type: 'error', text: '切换数据库位置失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefault = async () => {
    if (!electronAPI) return;
    if (!confirm('确定恢复为默认数据库位置吗？默认位置的数据库文件将重新加载。')) return;
    setLoading(true);
    setMessage(null);
    try {
      await electronAPI.config.setDbPath(defaultDbPath);
      setDbPath(defaultDbPath);
      await reload();
      setMessage({ type: 'success', text: '已恢复为默认数据库位置。' });
    } catch (e) {
      setMessage({ type: 'error', text: '恢复默认位置失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleImportDb = async () => {
    if (!electronAPI) return;
    setLoading(true);
    setMessage(null);
    try {
      const filePath = await electronAPI.config.selectDbFile();
      if (!filePath) {
        setLoading(false);
        return;
      }
      await electronAPI.db.importDbFile(filePath);
      await reload();
      setMessage({ type: 'success', text: '数据库导入成功，已重新加载数据。' });
    } catch (e) {
      setMessage({ type: 'error', text: '导入数据库失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleBackupDb = async () => {
    if (!electronAPI) return;
    setLoading(true);
    setMessage(null);
    try {
      const backupPath = await electronAPI.db.backupDb();
      if (backupPath) {
        setMessage({ type: 'success', text: '已备份到：' + backupPath });
      } else {
        setMessage({ type: 'info', text: '当前数据库文件不存在，无需备份。' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: '备份数据库失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  // 日志目录
  const handleSelectLogFolder = async () => {
    if (!electronAPI) return;
    setLoading(true);
    setMessage(null);
    try {
      const folder = await electronAPI.config.selectLogFolder();
      if (!folder) {
        setLoading(false);
        return;
      }
      await electronAPI.config.setLogDir(folder);
      setLogDir(folder);
      setMessage({ type: 'success', text: '日志存放位置已切换。新日志将写入该目录，已有日志文件未自动迁移。' });
    } catch (e) {
      setMessage({ type: 'error', text: '切换日志位置失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleResetLogDefault = async () => {
    if (!electronAPI) return;
    if (!confirm('确定恢复为默认日志存放位置吗？')) return;
    setLoading(true);
    setMessage(null);
    try {
      await electronAPI.config.setLogDir(defaultLogDir);
      setLogDir(defaultLogDir);
      setMessage({ type: 'success', text: '已恢复为默认日志存放位置。' });
    } catch (e) {
      setMessage({ type: 'error', text: '恢复默认日志位置失败：' + String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = () => {
    setExchangeRates({ ...DEFAULT_EXCHANGE_RATES, ...rates });
    setRateMessage({ type: 'success', text: '汇率已保存，资产汇总将按新汇率折算为人民币。' });
  };
  const handleResetRates = () => {
    setRates({ ...DEFAULT_EXCHANGE_RATES });
    setExchangeRates({ ...DEFAULT_EXCHANGE_RATES });
    setRateMessage({ type: 'success', text: '已恢复为默认汇率。' });
  };

  const isDefault = dbPath === defaultDbPath;
  const isLogDefault = logDir === defaultLogDir;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold text-wealth-dark">设置</h2>
        <p className="text-wealth-text-light mt-1">管理应用数据存储位置</p>
      </div>

      <section className="bg-white rounded-xl shadow-sm border border-wealth-cream p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-wealth-gold/10 flex items-center justify-center">
            <Database size={20} className="text-wealth-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-wealth-dark">数据库文件位置</h3>
            <p className="text-xs text-wealth-text-light">数据将保存到此位置的 WealthCare.db 文件中</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-wealth-text mb-2">当前数据库路径</label>
          <div className="px-4 py-3 bg-wealth-cream rounded-lg border border-wealth-cream-dark/30 break-all text-sm text-wealth-text font-mono">
            {dbPath || '加载中...'}
          </div>
          {isDefault ? (
            <p className="text-xs text-wealth-text-light mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> 当前为默认位置
            </p>
          ) : (
            <p className="text-xs text-wealth-gold mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> 当前为自定义位置
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSelectFolder}
            disabled={!electronAPI || loading}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <FolderOpen size={18} />
            {loading ? '处理中...' : '选择新位置'}
          </button>
          <button
            onClick={handleResetDefault}
            disabled={!electronAPI || loading || isDefault}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-wealth-cream-dark/30"
          >
            <RotateCcw size={18} />
            恢复默认位置
          </button>
          <button
            onClick={handleImportDb}
            disabled={!electronAPI || loading}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-wealth-cream-dark/30"
          >
            <Upload size={18} />
            导入数据库
          </button>
          <button
            onClick={handleBackupDb}
            disabled={!electronAPI || loading}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-wealth-cream-dark/30"
          >
            <Download size={18} />
            备份当前数据库
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            ) : (
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}
      </section>

      {/* 日志目录 */}
      <section className="mt-6 bg-white rounded-xl shadow-sm border border-wealth-cream p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-wealth-gold/10 flex items-center justify-center">
            <ScrollText size={20} className="text-wealth-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-wealth-dark">日志存放位置</h3>
            <p className="text-xs text-wealth-text-light">运行日志和操作审计日志将保存到此目录</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-wealth-text mb-2">当前日志目录</label>
          <div className="px-4 py-3 bg-wealth-cream rounded-lg border border-wealth-cream-dark/30 break-all text-sm text-wealth-text font-mono">
            {logDir || '加载中...'}
          </div>
          {isLogDefault ? (
            <p className="text-xs text-wealth-text-light mt-2 flex items-center gap-1">
              <CheckCircle2 size={12} /> 当前为默认位置
            </p>
          ) : (
            <p className="text-xs text-wealth-gold mt-2 flex items-center gap-1">
              <AlertTriangle size={12} /> 当前为自定义位置
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSelectLogFolder}
            disabled={!electronAPI || loading}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <FolderOpen size={18} />
            {loading ? '处理中...' : '选择新位置'}
          </button>
          <button
            onClick={handleResetLogDefault}
            disabled={!electronAPI || loading || isLogDefault}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-wealth-cream-dark/30"
          >
            <RotateCcw size={18} />
            恢复默认位置
          </button>
        </div>
      </section>

      {/* 汇率设置 */}
      <section className="mt-6 bg-white rounded-xl shadow-sm border border-wealth-cream p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-wealth-gold/10 flex items-center justify-center">
            <DollarSign size={20} className="text-wealth-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-wealth-dark">汇率设置</h3>
            <p className="text-xs text-wealth-text-light">设置外币相对人民币的汇率（1 外币 = ? 人民币），资产/负债汇总时按汇率折算为人民币</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {SUPPORTED_CURRENCIES.filter((c) => c.code !== 'CNY').map((c) => (
            <div key={c.code}>
              <label className="block text-sm font-medium text-wealth-text mb-1">{c.label}（{c.code}）</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-wealth-text-light whitespace-nowrap">1 {c.code} =</span>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  value={rates[c.code] ?? ''}
                  onChange={(e) => setRates((prev) => ({ ...prev, [c.code]: e.target.value === '' ? 0 : parseFloat(e.target.value) }))}
                  className="flex-1 min-w-0 px-3 py-2 text-sm border border-wealth-border rounded-lg focus:outline-none focus:ring-2 focus:ring-wealth-gold bg-white"
                />
                <span className="text-sm text-wealth-text-light whitespace-nowrap">元</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSaveRates}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-gold text-white rounded-lg hover:bg-wealth-gold-dark transition-colors font-medium"
          >
            <CheckCircle2 size={18} />
            保存汇率
          </button>
          <button
            onClick={handleResetRates}
            className="flex items-center gap-2 px-4 py-2 bg-wealth-cream text-wealth-text rounded-lg hover:bg-wealth-cream-dark/30 transition-colors font-medium border border-wealth-cream-dark/30"
          >
            <RotateCcw size={18} />
            恢复默认汇率
          </button>
        </div>

        {rateMessage && (
          <div
            className={`mt-4 px-4 py-3 rounded-lg text-sm flex items-start gap-2 ${
              rateMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
            <span>{rateMessage.text}</span>
          </div>
        )}
      </section>

      <section className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">注意事项</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>切换数据库位置后，应用将加载新位置的数据库文件（若不存在则会自动创建空数据库）。</li>
              <li>可通过「导入数据库」手动恢复旧版本或备份的数据库文件，导入前会自动备份当前数据库。</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
