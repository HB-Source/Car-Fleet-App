import { Moon, Sun, Database, Github, Info, CarFront } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { useVehicles } from '../hooks/useVehicles';
import { VEHICLE_STATUSES, STATUS_LABELS } from '../types/vehicle';

export function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { vehicles } = useVehicles();

  return (
    <div className="min-h-screen pb-28">
      <PageHeader title="Settings" subtitle="App preferences and fleet admin" />

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* Appearance */}
        <section className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
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
          style={{ animationDelay: '60ms' }}
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
          style={{ animationDelay: '120ms' }}
        >
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Database size={16} className="text-slate-400" /> Backend
          </h2>
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3.5 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-white/10">
            <span className="text-sm font-medium">Supabase connection</span>
            {isSupabaseConfigured ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Demo mode
              </span>
            )}
          </div>
          {!isSupabaseConfigured && (
            <p className="mt-2.5 flex items-start gap-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">
              <Info size={13} className="mt-0.5 shrink-0" />
              Running with local demo data. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to
              connect a live Supabase backend.
            </p>
          )}
        </section>

        {/* About */}
        <section
          className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
          style={{ animationDelay: '180ms' }}
        >
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Github size={16} className="text-slate-400" /> About
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            FleetPilot v1.0 — a mobile-first fleet management app built with React, Vite,
            Tailwind CSS, Supabase, React Leaflet and OpenStreetMap. Deployed automatically with
            GitHub Actions.
          </p>
        </section>
      </div>
    </div>
  );
}
