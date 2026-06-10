import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './pages/Dashboard';
import { VehicleDetail } from './pages/VehicleDetail';
import { Settings } from './pages/Settings';

// Map and QR scanner pull in heavy libraries (leaflet, html5-qrcode) —
// lazy-load them so the dashboard stays fast on mobile connections.
const MapView = lazy(() => import('./pages/MapView').then((m) => ({ default: m.MapView })));
const QROnboarding = lazy(() =>
  import('./pages/QROnboarding').then((m) => ({ default: m.QROnboarding })),
);

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center pb-24">
      <Loader2 size={28} className="animate-spin text-brand-500" />
    </div>
  );
}

// HashRouter keeps client-side routing working on static hosts like
// GitHub Pages, where deep links would otherwise 404.
export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles/:id" element={<VehicleDetail />} />
            <Route path="/onboard" element={<QROnboarding />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </HashRouter>
    </ThemeProvider>
  );
}
