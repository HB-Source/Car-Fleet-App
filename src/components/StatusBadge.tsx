import { STATUS_LABELS, type VehicleStatus } from '../types/vehicle';

const STYLES: Record<VehicleStatus, string> = {
  available:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  in_use: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  maintenance:
    'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  offline: 'bg-slate-200 text-slate-600 dark:bg-slate-500/15 dark:text-slate-400',
};

const DOT_STYLES: Record<VehicleStatus, string> = {
  available: 'bg-emerald-500',
  in_use: 'bg-blue-500',
  maintenance: 'bg-amber-500',
  offline: 'bg-slate-400',
};

export function StatusBadge({ status }: { status: VehicleStatus }) {
  return (
    <span
      data-testid="status-badge"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
