import { NavLink } from 'react-router-dom';
import { LayoutGrid, Map, QrCode, Settings } from 'lucide-react';

const TABS = [
  { to: '/', label: 'Fleet', icon: LayoutGrid, end: true },
  { to: '/map', label: 'Map', icon: Map, end: false },
  { to: '/onboard', label: 'Scan', icon: QrCode, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-lg items-stretch justify-around pb-safe">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`rounded-xl px-3 py-0.5 transition-colors ${
                    isActive ? 'bg-brand-100 dark:bg-brand-500/15' : ''
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
