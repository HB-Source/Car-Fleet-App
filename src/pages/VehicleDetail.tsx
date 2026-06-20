import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Car,
  Check,
  Clock,
  Crosshair,
  Gauge,
  HeartPulse,
  Loader2,
  MapPin,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import {
  fetchVehicleById,
  fetchVehicleEvents,
  updateVehicle,
} from '../api/vehicles';
import { fetchUsers } from '../api/users';
import { isApiConfigured } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  STATUS_LABELS,
  VEHICLE_STATUSES,
  type Vehicle,
  type VehicleEvent,
  type VehicleStatus,
  type VehicleUpdate,
  type VehiclePhoto,
  type VehicleDocument,
} from '../types/vehicle';
import type { User } from '../types/user';
import { StatusBadge } from '../components/StatusBadge';
import { ErrorState } from '../components/ErrorState';
import { CompletionRing } from '../components/CompletionRing';
import { PhotoGallery } from '../components/PhotoGallery';
import { DocumentVault } from '../components/DocumentVault';
import { HistoryTimeline } from '../components/HistoryTimeline';
import { VehicleQrCard } from '../components/VehicleQrCard';
import { ComingSoonCard } from '../components/ComingSoonCard';
import { getDocuments, getMainPhoto, getPhotos } from '../lib/vehicleMedia';
import { computeCompletion } from '../utils/completion';
import { formatMileage, timeAgo } from '../utils/format';

type Tab = 'overview' | 'details' | 'history' | 'location' | 'docs' | 'qr';

const inputClass =
  'w-full rounded-2xl border-0 bg-slate-100 px-4 py-3 text-sm ring-1 ring-slate-900/5 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60 dark:bg-slate-800 dark:ring-white/10';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm font-medium text-right">{value || '—'}</dd>
    </div>
  );
}

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [events, setEvents] = useState<VehicleEvent[]>([]);
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const canEditAll = hasRole('admin', 'manager');
  const isOwnVehicle = Boolean(vehicle?.assigned_driver_id && vehicle.assigned_driver_id === user?.id);
  const canEditOperational = canEditAll || isOwnVehicle;

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
          return;
        }
        setVehicle(v);
        setForm(toForm(v));
        setError(null);
        setPhotos(getPhotos(id));
        setDocuments(getDocuments(id));
        if (isApiConfigured) {
          const [evts, driverList] = await Promise.all([
            fetchVehicleEvents(id).catch(() => []),
            canEditAll ? fetchUsers({ role: 'driver' }).catch(() => []) : Promise.resolve([]),
          ]);
          if (!cancelled) {
            setEvents(evts);
            setDrivers(driverList.filter((d) => d.active));
          }
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
  }, [id, canEditAll]);

  const completion = useMemo(
    () => (vehicle ? computeCompletion(vehicle, photos.length > 0) : { percent: 0, missing: [] }),
    [vehicle, photos.length],
  );

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setSaved(false);
  };

  const persist = async (changes: VehicleUpdate) => {
    if (!vehicle) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateVehicle(vehicle.id, changes);
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

  const numOrNull = (v: string) => (v.trim() === '' ? null : Number(v));

  const saveDetails = () => {
    const operational: VehicleUpdate = {
      status: form.status as VehicleStatus,
      mileage: Number.parseInt(form.mileage, 10) || 0,
      maintenance_notes: form.maintenance_notes.trim() || null,
    };
    if (!canEditAll) {
      persist(operational);
      return;
    }
    persist({
      ...operational,
      vehicle_name: form.vehicle_name.trim(),
      plate_number: form.plate_number.trim(),
      make: form.make.trim() || null,
      car_model: form.car_model.trim() || null,
      year: numOrNull(form.year),
      color: form.color.trim() || null,
      vin: form.vin.trim() || null,
      fuel_type: form.fuel_type.trim() || null,
      transmission: form.transmission.trim() || null,
      vehicle_category: form.vehicle_category.trim() || null,
      ownership_status: form.ownership_status.trim() || null,
      registration_date: form.registration_date || null,
      insurance_expiry: form.insurance_expiry || null,
      road_tax_expiry: form.road_tax_expiry || null,
      mot_expiry: form.mot_expiry || null,
      purchase_date: form.purchase_date || null,
      purchase_price: numOrNull(form.purchase_price),
      current_value: numOrNull(form.current_value),
      ...(isApiConfigured
        ? { assigned_driver_id: form.assigned_driver_id || null }
        : { driver: form.driver.trim() || 'Unassigned' }),
    });
  };

  const saveLocation = () =>
    persist({
      location_id: form.location_id.trim(),
      location_note: form.location_note.trim() || null,
      latitude: form.latitude.trim() === '' ? null : Number.parseFloat(form.latitude),
      longitude: form.longitude.trim() === '' ? null : Number.parseFloat(form.longitude),
    });

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      set('latitude', pos.coords.latitude.toFixed(6));
      set('longitude', pos.coords.longitude.toFixed(6));
    });
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

  if (!vehicle) return null;

  const mainPhoto = getMainPhoto(vehicle.id);
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'details', label: 'Details' },
    { key: 'history', label: 'History' },
    { key: 'location', label: 'Location' },
    { key: 'docs', label: 'Documents' },
    { key: 'qr', label: 'QR' },
  ];

  return (
    <div className="min-h-screen pb-28">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-600 via-brand-700 to-purple-700 pt-safe text-white">
        <div className="mx-auto max-w-lg px-4 pb-5 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition-transform active:scale-95"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <div className="flex items-center gap-4 animate-slide-up">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-3xl bg-white/15 backdrop-blur">
              {mainPhoto ? (
                <img src={mainPhoto.dataUrl} alt={vehicle.vehicle_name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Car size={28} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold tracking-tight">{vehicle.vehicle_name}</h1>
              <p className="font-mono text-sm tracking-wider text-white/75">{vehicle.plate_number}</p>
            </div>
            <div className="shrink-0 rounded-2xl bg-white/10 p-1.5 backdrop-blur">
              <CompletionRing percent={completion.percent} />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/80">
            <StatusBadge status={vehicle.status} />
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
              <Gauge size={12} /> {formatMileage(vehicle.mileage)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
              <MapPin size={12} /> {vehicle.location_note || vehicle.location_id || 'No location'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
              <Clock size={12} /> {timeAgo(vehicle.last_updated)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-[800] border-b border-slate-200/60 bg-slate-100/90 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/90">
        <div className="no-scrollbar mx-auto flex max-w-lg gap-1 overflow-x-auto px-3 py-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-4 px-4 pt-4">
        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {error}
          </p>
        )}

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <>
            <PhotoGallery vehicleId={vehicle.id} photos={photos} onChange={setPhotos} canEdit={canEditOperational} />

            <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
              <h2 className="text-sm font-bold">At a glance</h2>
              <dl className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                <InfoRow label="Assigned driver" value={vehicle.driver} />
                <InfoRow label="Make / model" value={[vehicle.make, vehicle.car_model].filter(Boolean).join(' ')} />
                <InfoRow label="Year" value={vehicle.year} />
                <InfoRow label="Colour" value={vehicle.color} />
                <InfoRow label="Fuel · transmission" value={[vehicle.fuel_type, vehicle.transmission].filter(Boolean).join(' · ')} />
              </dl>
            </section>

            {completion.missing.length > 0 && (
              <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
                <h2 className="text-sm font-bold">Profile completion · {completion.percent}%</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Add to complete the passport:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {completion.missing.map((m) => (
                    <span key={m} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {m}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <ComingSoonCard
              icon={Wrench}
              title="Car maintenance"
              description="Track service schedules, repairs, reminders and maintenance costs in one place."
              features={['Service reminders', 'Oil change tracking', 'Tyre reminders', 'MOT reminders', 'Cost history']}
            />
            <ComingSoonCard
              icon={HeartPulse}
              title="Car health"
              description="Connect future devices to monitor vehicle health, diagnostics and live condition data."
              features={['Health score', 'Battery condition', 'Tyre condition', 'Warning alerts', 'Predictive repairs']}
            />
          </>
        )}

        {/* DETAILS */}
        {tab === 'details' && (
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <h2 className="text-sm font-bold">{canEditOperational ? 'Manage vehicle' : 'Vehicle details'}</h2>
            {!canEditOperational ? (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This vehicle is assigned to <span className="font-semibold">{vehicle.driver}</span>. You have
                read-only access.
              </p>
            ) : (
              <div className="mt-3 space-y-3.5">
                {canEditAll && (
                  <>
                    <Field label="Vehicle name">
                      <input className={inputClass} value={form.vehicle_name} onChange={(e) => set('vehicle_name', e.target.value)} />
                    </Field>
                    <Field label="Registration / plate">
                      <input className={inputClass} value={form.plate_number} onChange={(e) => set('plate_number', e.target.value)} />
                    </Field>
                  </>
                )}
                <Field label="Status">
                  <div className="grid grid-cols-2 gap-2">
                    {VEHICLE_STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('status', s)}
                        className={`rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                          form.status === s
                            ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white'
                            : 'bg-slate-100 text-slate-600 ring-1 ring-slate-900/5 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10'
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </Field>
                {canEditAll &&
                  (isApiConfigured ? (
                    <Field label="Assigned driver">
                      <select className={inputClass} value={form.assigned_driver_id} onChange={(e) => set('assigned_driver_id', e.target.value)}>
                        <option value="">Unassigned</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.email})
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <Field label="Assigned driver">
                      <input className={inputClass} value={form.driver} onChange={(e) => set('driver', e.target.value)} placeholder="Unassigned" />
                    </Field>
                  ))}
                <Field label="Mileage (km)">
                  <input className={inputClass} type="number" inputMode="numeric" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} />
                </Field>

                {canEditAll && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Make"><input className={inputClass} value={form.make} onChange={(e) => set('make', e.target.value)} /></Field>
                      <Field label="Model"><input className={inputClass} value={form.car_model} onChange={(e) => set('car_model', e.target.value)} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Year"><input className={inputClass} type="number" value={form.year} onChange={(e) => set('year', e.target.value)} /></Field>
                      <Field label="Colour"><input className={inputClass} value={form.color} onChange={(e) => set('color', e.target.value)} /></Field>
                    </div>
                    <Field label="VIN"><input className={inputClass} value={form.vin} onChange={(e) => set('vin', e.target.value)} /></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Fuel type"><input className={inputClass} value={form.fuel_type} onChange={(e) => set('fuel_type', e.target.value)} /></Field>
                      <Field label="Transmission"><input className={inputClass} value={form.transmission} onChange={(e) => set('transmission', e.target.value)} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Category"><input className={inputClass} value={form.vehicle_category} onChange={(e) => set('vehicle_category', e.target.value)} /></Field>
                      <Field label="Ownership"><input className={inputClass} value={form.ownership_status} onChange={(e) => set('ownership_status', e.target.value)} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Insurance expiry"><input className={inputClass} type="date" value={form.insurance_expiry} onChange={(e) => set('insurance_expiry', e.target.value)} /></Field>
                      <Field label="Road tax expiry"><input className={inputClass} type="date" value={form.road_tax_expiry} onChange={(e) => set('road_tax_expiry', e.target.value)} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="MOT expiry"><input className={inputClass} type="date" value={form.mot_expiry} onChange={(e) => set('mot_expiry', e.target.value)} /></Field>
                      <Field label="Purchase date"><input className={inputClass} type="date" value={form.purchase_date} onChange={(e) => set('purchase_date', e.target.value)} /></Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Purchase price"><input className={inputClass} type="number" value={form.purchase_price} onChange={(e) => set('purchase_price', e.target.value)} /></Field>
                      <Field label="Current value"><input className={inputClass} type="number" value={form.current_value} onChange={(e) => set('current_value', e.target.value)} /></Field>
                    </div>
                  </>
                )}

                <Field label="Maintenance notes">
                  <textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.maintenance_notes} onChange={(e) => set('maintenance_notes', e.target.value)} placeholder="No maintenance notes" />
                </Field>

                <button
                  onClick={saveDetails}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
                  {saved ? 'Saved' : 'Save details'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <HistoryTimeline
            vehicleId={vehicle.id}
            events={events}
            onChange={setEvents}
            canEdit={canEditOperational}
            available={isApiConfigured}
          />
        )}

        {/* LOCATION */}
        {tab === 'location' && (
          <section className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <MapPin size={16} className="text-slate-400" /> Manual location
              </h2>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                Last known
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Set the car's last known location manually. Live GPS tracking support coming soon.
            </p>

            {canEditOperational ? (
              <div className="mt-3 space-y-3">
                <Field label="Location label">
                  <input className={inputClass} value={form.location_id} onChange={(e) => set('location_id', e.target.value)} placeholder="depot-a" />
                </Field>
                <Field label="Location note">
                  <input className={inputClass} value={form.location_note} onChange={(e) => set('location_note', e.target.value)} placeholder="Parked at warehouse" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Latitude"><input className={inputClass} type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} /></Field>
                  <Field label="Longitude"><input className={inputClass} type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} /></Field>
                </div>
                <button
                  onClick={useCurrentLocation}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700 transition-transform active:scale-95 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Crosshair size={15} /> Use my current location
                </button>
                <button
                  onClick={saveLocation}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-transform active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
                  {saved ? 'Saved' : 'Save location'}
                </button>
              </div>
            ) : (
              <dl className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                <InfoRow label="Location" value={vehicle.location_note || vehicle.location_id} />
                <InfoRow label="Coordinates" value={vehicle.latitude != null ? `${vehicle.latitude}, ${vehicle.longitude}` : '—'} />
              </dl>
            )}

            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <UserIcon size={12} /> Location manually updated
              {vehicle.location_updated_at ? ` · ${timeAgo(vehicle.location_updated_at)}` : ''}
            </p>
            {vehicle.latitude != null && (
              <Link to="/map" className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-brand-600 transition-transform active:scale-95 dark:bg-slate-800 dark:text-brand-400">
                <Activity size={15} /> View on fleet map
              </Link>
            )}
          </section>
        )}

        {/* DOCUMENTS */}
        {tab === 'docs' && (
          <DocumentVault vehicleId={vehicle.id} documents={documents} onChange={setDocuments} canEdit={canEditOperational} />
        )}

        {/* QR */}
        {tab === 'qr' && <VehicleQrCard vehicleId={vehicle.id} qrCodeId={vehicle.qr_code_id} />}
      </div>
    </div>
  );
}

function toForm(v: Vehicle): Record<string, string> {
  const s = (x: unknown) => (x === null || x === undefined ? '' : String(x));
  return {
    vehicle_name: v.vehicle_name,
    plate_number: v.plate_number,
    status: v.status,
    driver: v.driver,
    assigned_driver_id: v.assigned_driver_id ?? '',
    mileage: s(v.mileage),
    location_id: v.location_id,
    location_note: s(v.location_note),
    latitude: v.latitude != null ? String(v.latitude) : '',
    longitude: v.longitude != null ? String(v.longitude) : '',
    maintenance_notes: v.maintenance_notes ?? '',
    make: s(v.make),
    car_model: s(v.car_model),
    year: s(v.year),
    color: s(v.color),
    vin: s(v.vin),
    fuel_type: s(v.fuel_type),
    transmission: s(v.transmission),
    vehicle_category: s(v.vehicle_category),
    ownership_status: s(v.ownership_status),
    registration_date: s(v.registration_date),
    insurance_expiry: s(v.insurance_expiry),
    road_tax_expiry: s(v.road_tax_expiry),
    mot_expiry: s(v.mot_expiry),
    purchase_date: s(v.purchase_date),
    purchase_price: s(v.purchase_price),
    current_value: s(v.current_value),
  };
}
