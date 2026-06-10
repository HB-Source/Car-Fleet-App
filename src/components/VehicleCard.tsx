import { Link } from 'react-router-dom';
import { Car, Gauge, MapPin, User, Clock, ChevronRight } from 'lucide-react';
import type { Vehicle } from '../types/vehicle';
import { StatusBadge } from './StatusBadge';
import { formatMileage, timeAgo } from '../utils/format';

export function VehicleCard({ vehicle, index = 0 }: { vehicle: Vehicle; index?: number }) {
  return (
    <Link
      to={`/vehicles/${vehicle.id}`}
      className="block animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 transition-all active:scale-[0.98] dark:bg-slate-900 dark:ring-white/10"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-purple-500 text-white shadow-md shadow-brand-500/25">
            <Car size={20} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{vehicle.vehicle_name}</h3>
            <p className="mt-0.5 font-mono text-xs tracking-wider text-slate-500 dark:text-slate-400">
              {vehicle.plate_number}
            </p>
          </div>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <User size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{vehicle.driver || 'Unassigned'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <Gauge size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{formatMileage(vehicle.mileage)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <MapPin size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{vehicle.location_id || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Clock size={14} className="shrink-0 text-slate-400" />
          <span className="truncate">{timeAgo(vehicle.last_updated)}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end text-xs font-medium text-brand-600 dark:text-brand-400">
        Manage vehicle <ChevronRight size={14} />
      </div>
    </Link>
  );
}
