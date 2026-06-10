import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, MapPinOff } from 'lucide-react';
import { useVehicles } from '../hooks/useVehicles';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { StatusBadge } from '../components/StatusBadge';
import { timeAgo } from '../utils/format';
import type { Vehicle, VehicleStatus } from '../types/vehicle';

const STATUS_COLORS: Record<VehicleStatus, string> = {
  available: '#10b981',
  in_use: '#3b82f6',
  maintenance: '#f59e0b',
  offline: '#94a3b8',
};

function vehicleIcon(status: VehicleStatus): L.DivIcon {
  const color = STATUS_COLORS[status];
  return L.divIcon({
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 36],
    popupAnchor: [0, -34],
    html: `
      <div style="position:relative;width:38px;height:38px;filter:drop-shadow(0 3px 6px rgba(15,23,42,0.35));">
        <svg viewBox="0 0 38 38" width="38" height="38">
          <path d="M19 1C11 1 4.5 7.4 4.5 15.3 4.5 25.4 19 37 19 37S33.5 25.4 33.5 15.3C33.5 7.4 27 1 19 1Z" fill="${color}"/>
          <circle cx="19" cy="15" r="9" fill="white"/>
          <path d="M13.5 17.5l1.2-3.4a1.6 1.6 0 0 1 1.5-1.1h5.6a1.6 1.6 0 0 1 1.5 1.1l1.2 3.4v3.2a.8.8 0 0 1-.8.8h-.7a.8.8 0 0 1-.8-.8v-.7h-8.4v.7a.8.8 0 0 1-.8.8h-.7a.8.8 0 0 1-.8-.8v-3.2z" fill="${color}"/>
        </svg>
      </div>`,
  });
}

const DEFAULT_CENTER: [number, number] = [52.3676, 4.9041];

export function MapView() {
  const { vehicles, loading, error, refresh } = useVehicles();

  const located = useMemo(
    () =>
      vehicles.filter(
        (v): v is Vehicle & { latitude: number; longitude: number } =>
          v.latitude !== null && v.longitude !== null,
      ),
    [vehicles],
  );

  const center = useMemo<[number, number]>(() => {
    if (located.length === 0) return DEFAULT_CENTER;
    const lat = located.reduce((s, v) => s + v.latitude, 0) / located.length;
    const lng = located.reduce((s, v) => s + v.longitude, 0) / located.length;
    return [lat, lng];
  }, [located]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center pb-24">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-24 pt-8">
        <ErrorState message={error} onRetry={() => refresh()} />
      </div>
    );
  }

  if (located.length === 0) {
    return (
      <div className="min-h-screen pb-24 pt-8">
        <EmptyState
          icon={MapPinOff}
          title="No vehicle locations"
          description="No vehicles have GPS coordinates yet. Add latitude and longitude on the vehicle detail page."
        />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full">
      <MapContainer
        center={center}
        zoom={10}
        zoomControl={false}
        className="h-full w-full"
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={48} showCoverageOnHover={false}>
          {located.map((v) => (
            <Marker key={v.id} position={[v.latitude, v.longitude]} icon={vehicleIcon(v.status)}>
              <Popup>
                <div className="min-w-[190px]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold leading-tight">{v.vehicle_name}</p>
                      <p className="mt-0.5 font-mono text-xs tracking-wider text-slate-500">
                        {v.plate_number}
                      </p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                  <dl className="mt-2.5 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-400">Driver</dt>
                      <dd className="font-medium">{v.driver || 'Unassigned'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-400">Updated</dt>
                      <dd className="font-medium">{timeAgo(v.last_updated)}</dd>
                    </div>
                  </dl>
                  <Link
                    to={`/vehicles/${v.id}`}
                    className="mt-3 block rounded-xl bg-gradient-to-r from-brand-600 to-purple-600 py-2 text-center text-xs font-bold !text-white no-underline"
                  >
                    Manage vehicle
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Floating legend */}
      <div className="pointer-events-none absolute left-4 right-4 top-4 z-[800] pt-safe">
        <div className="mx-auto flex max-w-lg items-center justify-between rounded-2xl bg-white/90 px-4 py-2.5 shadow-lg ring-1 ring-slate-900/5 backdrop-blur dark:bg-slate-900/90 dark:ring-white/10">
          <span className="text-sm font-bold">Live map</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {located.length} of {vehicles.length} vehicles located
          </span>
        </div>
      </div>
    </div>
  );
}
