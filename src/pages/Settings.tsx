import { useEffect, useState } from 'react';
import { FolderOpen, RotateCcw, Database, AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import { useWealthStore } from '@/store/wealthStore';
import { PrintableAssetTable } from '@/components/print/PrintableAssetTable';
import { PrintableLiabilityTable } from '@/components/print/PrintableLiabilityTable';

export function Settings() {
  const electronAPI = typeof window !== 'undefined' ? window.electronAPI : undefined;
  const reload = useWealthStore((s) => s.reload);

  const [dbPath, setDbPath] = useState<string>('');
  const [defaultDbPath, setDefaultDbPath] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!electronAPI) {
      setMessage({ type: 'error', text: '当前为浏览器模式，设置功能仅在桌面应用中可用。' });
      return;
    }
    (async () => {
      try {
        const current = await electronAPI.config.getDbPath();
        const def = await electronAPI.config.getDefaultDbPath();
        setDbPath(current);
        setDefaultDbPath(def);
      } catch (e) {
        setMessage({ type: 'error', text: '读取数据库路径失败：' + String(e) });
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
      const newDbPath = folder.replace(/[\\/]+$/, '') + '\\wealth-tracker.db';
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

  const isDefault = dbPath === defaultDbPath;

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

      <section className="mt-6 bg-white rounded-xl shadow-sm border border-wealth-cream p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-wealth-gold/10 flex items-center justify-center">
            <Printer size={20} className="text-wealth-gold" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-wealth-dark">打印资产/负债明细</h3>
            <p className="text-xs text-wealth-text-light">按分类筛选后打印明细数据</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-wealth-text mb-3">资产明细</h4>
            <PrintableAssetTable />
          </div>
          <div className="border-t border-wealth-cream pt-6">
            <h4 className="font-semibold text-wealth-text mb-3">负债明细</h4>
            <PrintableLiabilityTable />
          </div>
        </div>
      </section>

      <section className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">注意事项</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>切换数据库位置后，应用将加载新位置的数据库文件（若不存在则会自动创建空数据库）。</li>
              <li>原位置的数据不会自动迁移到新位置，如需保留请手动复制 WealthCare.db 文件。</li>
              <li>切换后界面显示的数据来自新位置的数据库。</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
