import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, CreditCard, TrendingUp } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: '仪表盘' },
    { path: '/assets', icon: Wallet, label: '资产管理' },
    { path: '/liabilities', icon: CreditCard, label: '负债管理' },
    { path: '/analysis', icon: TrendingUp, label: '统计分析' },
  ];

  return (
    <div className="flex h-screen bg-wealth-cream">
      {/* 左侧导航 */}
      <aside className="w-64 gradient-dark text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="font-display text-2xl font-bold text-wealth-gold">
            财富管家
          </h1>
          <p className="text-xs text-white/60 mt-1">个人财产管理系统</p>
        </div>
        <nav className="flex-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive
                    ? 'bg-wealth-gold/20 text-wealth-gold border-l-2 border-wealth-gold'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-body">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">
            © 2026 财富管家
          </p>
        </div>
      </aside>

      {/* 右侧内容区 */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
