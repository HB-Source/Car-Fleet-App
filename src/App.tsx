import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { BottomNav } from './components/BottomNav';
import { RequireAuth } from './components/RequireAuth';
import { Dashboard } from './pages/Dashboard';
import { VehicleDetail } from './pages/VehicleDetail';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Users } from './pages/Users';

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

function Shell() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/vehicles/:id"
            element={
              <RequireAuth>
                <VehicleDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/onboard"
            element={
              <RequireAuth>
                <QROnboarding />
              </RequireAuth>
            }
          />
          <Route
            path="/map"
            element={
              <RequireAuth>
                <MapView />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route
            path="/users"
            element={
              <RequireAuth adminOnly>
                <Users />
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
      {!isAuthPage && <BottomNav />}
    </>
  );
}

// HashRouter keeps client-side routing working on static hosts like
// GitHub Pages, where deep links would otherwise 404.
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
