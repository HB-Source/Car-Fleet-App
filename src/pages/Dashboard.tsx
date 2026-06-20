import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, QrCode, CarFront, SearchX, ArrowDownUp, Plus } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { filterVehicles, type SortOrder, type StatusFilter } from '../utils/filterVehicles';
import { STATUS_LABELS, VEHICLE_STATUSES } from '../types/vehicle';
import { VehicleCard } from '../components/VehicleCard';
import { SkeletonList } from '../components/SkeletonCard';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { PullToRefresh } from '../components/PullToRefresh';
import { PageHeader } from '../components/PageHeader';

const SORT_LABELS: Record<SortOrder, string> = {
  latest: 'Latest update',
  name: 'Name',
  mileage: 'Mileage',
};

export function Dashboard() {
  const { vehicles, loading, error, refresh } = useVehicles();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortOrder>('latest');

  const filtered = useMemo(
    () => filterVehicles(vehicles, search, statusFilter, sort),
    [vehicles, search, statusFilter, sort],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: vehicles.length };
    for (const s of VEHICLE_STATUSES) c[s] = vehicles.filter((v) => v.status === s).length;
    return c;
  }, [vehicles]);

  const cycleSort = () => {
    const orders: SortOrder[] = ['latest', 'name', 'mileage'];
    setSort(orders[(orders.indexOf(sort) + 1) % orders.length]);
  };

  return (
    <div className="min-h-screen pb-28">
      <PageHeader
        title="Fleet"
        subtitle={loading ? 'Loading vehicles…' : `${vehicles.length} vehicles registered`}
        trailing={
          <button
            onClick={cycleSort}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-95 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10"
          >
            <ArrowDownUp size={13} />
            {SORT_LABELS[sort]}
          </button>
        }
      />

      <PullToRefresh onRefresh={refresh}>
        <div className="mx-auto max-w-lg px-4">
          {/* Search */}
          <div className="relative mt-4">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, plate, driver, location…"
              className="w-full rounded-2xl border-0 bg-white py-3 pl-11 pr-4 text-sm shadow-sm ring-1 ring-slate-900/5 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:ring-white/10"
            />
          </div>

          {/* Status filter chips */}
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {(['all', ...VEHICLE_STATUSES] as StatusFilter[]).map((s) => {
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                    active
                      ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-500/25'
                      : 'bg-white text-slate-600 ring-1 ring-slate-900/5 dark:bg-slate-900 dark:text-slate-300 dark:ring-white/10'
                  }`}
                >
                  {s === 'all' ? 'All' : STATUS_LABELS[s]}
                  <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-slate-400'}`}>
                    {counts[s] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="mt-4">
            {loading ? (
              <SkeletonList />
            ) : error ? (
              <ErrorState message={error} onRetry={() => refresh()} />
            ) : filtered.length === 0 ? (
              vehicles.length === 0 ? (
                <EmptyState
                  icon={CarFront}
                  title="No vehicles yet"
                  description="Onboard your first vehicle by scanning its QR code."
                  action={
                    <Link
                      to="/onboard"
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-95"
                    >
                      <QrCode size={16} /> Scan QR code
                    </Link>
                  }
                />
              ) : (
                <EmptyState
                  icon={SearchX}
                  title="No matches"
                  description="Try a different search term or status filter."
                />
              )
            ) : (
              <div className="space-y-3">
                {filtered.map((v, i) => (
                  <VehicleCard key={v.id} vehicle={v} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>

      {/* Floating action button → Add vehicle (manual or QR) */}
      <Link
        to="/add"
        aria-label="Add a vehicle"
        className="fixed bottom-24 right-5 z-[950] flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-purple-600 text-white shadow-xl shadow-brand-500/40 transition-transform active:scale-90"
      >
        <Plus size={26} />
      </Link>
    </div>
  );
}
