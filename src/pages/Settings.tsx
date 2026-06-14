import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CarFront,
  ChevronRight,
  Database,
  Github,
  Info,
  Loader2,
  LogOut,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { isApiConfigured } from '../api/client';
import { disableMfa } from '../api/auth';
import { useVehicles } from '../hooks/useVehicles';
import { VEHICLE_STATUSES, STATUS_LABELS } from '../types/vehicle';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin, logout, refreshUser } = useAuth();
  const { vehicles } = useVehicles();
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisable, setShowDisable] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleDisableMfa = async () => {
    setBusy(true);
    setMfaError(null);
    try {
      await disableMfa(disablePassword);
      await refreshUser();
      setShowDisable(false);
      setDisablePassword('');
    } catch (err) {
      setMfaError(err instanceof Error ? err.message : 'Could not disable MFA');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Settings" subtitle="App preferences and fleet admin" />

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* Account */}
        <section className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
          <h2 className="text-sm font-bold">Account</h2>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-slate-100 px-4 py-3.5 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                isAdmin
                  ? 'bg-gradient-to-br from-brand-500 to-purple-500 text-white'
                  : 'bg-white text-slate-500 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {isAdmin ? <ShieldCheck size={18} /> : <UserRound size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{user?.name ?? 'Guest'}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {user?.email} · <span className="capitalize">{user?.role}</span>
              </p>
            </div>
            {isApiConfigured && (
              <button
                onClick={logout}
                aria-label="Sign out"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500 ring-1 ring-red-100 transition-transform active:scale-90 dark:bg-red-500/10 dark:ring-red-500/20"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          {isAdmin && isApiConfigured && (
            <Link
              to="/users"
              className="mt-2.5 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3.5 text-sm font-medium ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] dark:bg-slate-800 dark:ring-white/10"
            >
              <span className="flex items-center gap-3">
                <UsersRound size={18} className="text-brand-500" /> Manage team
              </span>
              <ChevronRight size={16} className="text-slate-400" />
            </Link>
          )}
        </section>

        {/* Security / MFA */}
        {isApiConfigured && (
          <section
            className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
            style={{ animationDelay: '25ms' }}
          >
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <Smartphone size={16} className="text-slate-400" /> Two-factor authentication
            </h2>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3.5 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10">
              <span className="flex items-center gap-2 text-sm font-medium">
                {user?.mfaEnabled ? (
                  <ShieldCheck size={18} className="text-emerald-500" />
                ) : (
                  <ShieldAlert size={18} className="text-amber-500" />
                )}
                {user?.mfaEnabled ? 'Enabled' : 'Not enabled'}
              </span>
              {user?.mfaEnabled ? (
                <button
                  onClick={() => {
                    setShowDisable((s) => !s);
                    setMfaError(null);
                  }}
                  className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 ring-1 ring-red-100 transition-transform active:scale-95 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
                >
                  Disable
                </button>
              ) : (
                <Link
                  to="/security/mfa"
                  className="rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-500/25 transition-transform active:scale-95"
                >
                  Enable
                </Link>
              )}
            </div>

            {showDisable && user?.mfaEnabled && (
              <div className="mt-2.5 space-y-2">
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Confirm your password to disable"
                  className="w-full rounded-2xl border-0 bg-slate-100 px-4 py-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:ring-white/10"
                />
                <button
                  onClick={handleDisableMfa}
                  disabled={busy || disablePassword.length < 1}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {busy && <Loader2 size={14} className="animate-spin" />} Disable MFA
                </button>
              </div>
            )}
            {mfaError && (
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {mfaError}
              </p>
            )}
          </section>
        )}

        {/* Appearance */}
        <section
          className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
          style={{ animationDelay: '50ms' }}
        >
          <h2 className="text-sm font-bold">Appearance</h2>
          <button
            onClick={toggleTheme}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-slate-100 px-4 py-3.5 ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] dark:bg-slate-800 dark:ring-white/10"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              {theme === 'dark' ? (
                <Moon size={18} className="text-brand-400" />
              ) : (
                <Sun size={18} className="text-amber-500" />
              )}
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            <span
              className={`relative h-7 w-12 rounded-full transition-colors ${
                theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                  theme === 'dark' ? 'left-[22px]' : 'left-0.5'
                }`}
              />
            </span>
          </button>
        </section>

        {/* Fleet overview */}
        <section
          className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
          style={{ animationDelay: '100ms' }}
        >
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <CarFront size={16} className="text-slate-400" /> Fleet overview
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {VEHICLE_STATUSES.map((s) => (
              <div
                key={s}
                className="rounded-2xl bg-slate-100 px-4 py-3 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10"
              >
                <p className="text-2xl font-bold">
                  {vehicles.filter((v) => v.status === s).length}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {STATUS_LABELS[s]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Backend status */}
        <section
          className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
          style={{ animationDelay: '150ms' }}
        >
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Database size={16} className="text-slate-400" /> Backend
          </h2>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3.5 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10">
            <span className="text-sm font-medium">FleetPilot API</span>
            {isApiConfigured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Demo mode
              </span>
            )}
          </div>
          {!isApiConfigured && (
            <p className="mt-2.5 flex items-start gap-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">
              <Info size={13} className="mt-0.5 shrink-0" />
              Running with local demo data. Set VITE_API_URL to connect the FleetPilot backend
              (Node.js + MongoDB) and unlock accounts, roles and team management.
            </p>
          )}
        </section>

        {/* About */}
        <section
          className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
          style={{ animationDelay: '200ms' }}
        >
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Github size={16} className="text-slate-400" /> About
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            FleetPilot v2.0 — a mobile-first fleet management app built with React, Vite, Tailwind
            CSS, React Leaflet and OpenStreetMap, backed by a Node.js + Express + MongoDB API with
            JWT auth and role-based access. Deployed automatically with GitHub Actions.
          </p>
        </section>
      </div>
    </div>
  );
}
