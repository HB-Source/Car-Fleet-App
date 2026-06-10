import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Car,
  Check,
  Loader2,
  MapPin,
  QrCode,
  CalendarDays,
  Clock,
} from 'lucide-react';
import { fetchVehicleById, updateVehicle } from '../api/vehicles';
import {
  STATUS_LABELS,
  VEHICLE_STATUSES,
  type Vehicle,
  type VehicleStatus,
} from '../types/vehicle';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ErrorState';
import { formatMileage, timeAgo } from '../utils/format';

interface FormState {
  vehicle_name: string;
  plate_number: string;
  status: VehicleStatus;
  driver: string;
  mileage: string;
  location_id: string;
  latitude: string;
  longitude: string;
  maintenance_notes: string;
}

function toForm(v: Vehicle): FormState {
  return {
    vehicle_name: v.vehicle_name,
    plate_number: v.plate_number,
    status: v.status,
    driver: v.driver,
    mileage: String(v.mileage),
    location_id: v.location_id,
    latitude: v.latitude !== null ? String(v.latitude) : '',
    longitude: v.longitude !== null ? String(v.longitude) : '',
    maintenance_notes: v.maintenance_notes ?? '',
  };
}

const inputClass =
  'w-full rounded-2xl border-0 bg-slate-100 px-4 py-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:ring-white/10';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const v = await fetchVehicleById(id);
        if (cancelled) return;
        if (!v) {
          setError('Vehicle not found.');
        } else {
          setVehicle(v);
          setForm(toForm(v));
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load vehicle');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!form || !vehicle) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateVehicle(vehicle.id, {
        vehicle_name: form.vehicle_name.trim(),
        plate_number: form.plate_number.trim(),
        status: form.status,
        driver: form.driver.trim() || 'Unassigned',
        mileage: Number.parseInt(form.mileage, 10) || 0,
        location_id: form.location_id.trim(),
        latitude: form.latitude.trim() === '' ? null : Number.parseFloat(form.latitude),
        longitude: form.longitude.trim() === '' ? null : Number.parseFloat(form.longitude),
        maintenance_notes: form.maintenance_notes.trim() || null,
      });
      setVehicle(updated);
      setForm(toForm(updated));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pb-24">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="min-h-screen pb-24">
        <ErrorState message={error} onRetry={() => navigate(0)} />
        <div className="text-center">
          <Link to="/" className="text-sm font-semibold text-brand-600 dark:text-brand-400">
            ← Back to fleet
          </Link>
        </div>
      </div>
    );
  }

  if (!vehicle || !form) return null;

  return (
    <div className="min-h-screen pb-28">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 pt-safe text-white">
        <div className="mx-auto max-w-lg px-4 pb-6 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-transform active:scale-95"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-4 animate-slide-up">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
              <Car size={26} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">{vehicle.vehicle_name}</h1>
              <p className="font-mono text-sm tracking-wider text-white/75">{vehicle.plate_number}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/80">
            <StatusBadge status={vehicle.status} />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
              <Clock size={12} /> Updated {timeAgo(vehicle.last_updated)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
              {formatMileage(vehicle.mileage)}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {/* Identifiers card */}
        <section className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
          <h2 className="text-sm font-bold">Identifiers</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <QrCode size={14} /> QR code ID
              </dt>
              <dd className="font-mono text-xs">{vehicle.qr_code_id}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <MapPin size={14} /> Location ID
              </dt>
              <dd className="font-mono text-xs">{vehicle.location_id || '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <CalendarDays size={14} /> Registered
              </dt>
              <dd className="text-xs">{vehicle.registration_date ?? '—'}</dd>
            </div>
          </dl>
        </section>

        {/* Edit form */}
        <section
          className="animate-slide-up rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10"
          style={{ animationDelay: '60ms' }}
        >
          <h2 className="text-sm font-bold">Manage vehicle</h2>
          <div className="mt-3 space-y-3.5">
            <Field label="Vehicle name">
              <input
                className={inputClass}
                value={form.vehicle_name}
                onChange={(e) => set('vehicle_name', e.target.value)}
              />
            </Field>
            <Field label="Plate number">
              <input
                className={inputClass}
                value={form.plate_number}
                onChange={(e) => set('plate_number', e.target.value)}
              />
            </Field>
            <Field label="Status">
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('status', s)}
                    className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                      form.status === s
                        ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md shadow-brand-500/25'
                        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10'
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Assigned driver">
              <input
                className={inputClass}
                value={form.driver}
                onChange={(e) => set('driver', e.target.value)}
                placeholder="Unassigned"
              />
            </Field>
            <Field label="Mileage (km)">
              <input
                className={inputClass}
                type="number"
                inputMode="numeric"
                value={form.mileage}
                onChange={(e) => set('mileage', e.target.value)}
              />
            </Field>
            <Field label="Location ID">
              <input
                className={inputClass}
                value={form.location_id}
                onChange={(e) => set('location_id', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={form.latitude}
                  onChange={(e) => set('latitude', e.target.value)}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className={inputClass}
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={form.longitude}
                  onChange={(e) => set('longitude', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Maintenance notes">
              <textarea
                className={`${inputClass} min-h-[88px] resize-y`}
                value={form.maintenance_notes}
                onChange={(e) => set('maintenance_notes', e.target.value)}
                placeholder="No maintenance notes"
              />
            </Field>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
              </>
            ) : saved ? (
              <>
                <Check size={16} /> Saved
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </section>

        {/* Map shortcut */}
        {vehicle.latitude !== null && vehicle.longitude !== null && (
          <Link
            to="/map"
            className="block animate-slide-up rounded-3xl bg-white p-4 text-sm font-semibold text-brand-600 shadow-sm ring-1 ring-slate-900/5 transition-transform active:scale-[0.98] dark:bg-slate-900 dark:text-brand-400 dark:ring-white/10"
            style={{ animationDelay: '120ms' }}
          >
            <span className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin size={16} /> View on live map
              </span>
              <span className="font-mono text-xs text-slate-400">
                {vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}
              </span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
