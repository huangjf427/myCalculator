import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Assets } from '@/pages/Assets';
import { Liabilities } from '@/pages/Liabilities';
import { Analysis } from '@/pages/Analysis';
import { Settings } from '@/pages/Settings';
import { useWealthStore } from '@/store/wealthStore';

function App() {
  const init = useWealthStore((s) => s.init);
  const initialized = useWealthStore((s) => s.initialized);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    init().finally(() => setLoading(false));
  }, [init]);

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wealth-cream">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-wealth-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-wealth-text-light">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/liabilities" element={<Liabilities />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
